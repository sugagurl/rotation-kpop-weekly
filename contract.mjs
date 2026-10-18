// Public weekly data contract. No application, auth, database or game dependencies.
import { z } from 'zod';
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const songSlug = z.string().min(1).max(2048).refine(v => { try {
    const decoded = decodeURIComponent(v);
    return !['.', '..'].includes(decoded) && !/[\/\\?#\u0000-\u0020]/.test(decoded) && !/%[a-f0-9]{2}/i.test(decoded) && new URL('https://rotation.today/song/' + v).pathname === '/song/' + v;
}
catch {
    return false;
} });
const rotationUrl = z.string().url().refine(v => { const u = new URL(v); return u.origin === 'https://rotation.today' && !u.username && !u.password && !u.hash; });
export const weeklySchema = z.object({
    schema_version: z.literal(1), edition_date: day, source_date: day, captured_at: z.string().datetime(), capture_kind: z.literal('weekly_snapshot'),
    coverage: z.object({ surface: z.literal('rotation_country_top20'), expected_countries: z.array(z.string().regex(/^[a-z]{2}$/)).min(1), captured_countries: z.array(z.string().regex(/^[a-z]{2}$/)), status: z.enum(['complete', 'partial']), classification_version: z.string().min(1), classification_status: z.enum(['reviewed', 'pending']) }),
    artists: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), roster_id: z.string().nullable(), evidence_url: z.string().url() })),
    songs: z.array(z.object({ id: songSlug, title: z.string().min(1), credits: z.string().min(1), artist_ids: z.array(z.string()).min(1), source_url: rotationUrl })),
    entries: z.array(z.object({ song_id: z.string(), country: z.string().regex(/^[a-z]{2}$/), position: z.number().int().min(1).max(20), source_date: day, source_url: rotationUrl })),
});
const unique = (xs) => new Set(xs).size === xs.length;
export function validateWeekly(raw) {
    const s = weeklySchema.parse(raw);
    const fail = (ok, note) => { if (!ok)
        throw Error(note); };
    fail(s.source_date <= s.edition_date && s.source_date <= s.captured_at.slice(0, 10), 'Source date is after capture/edition');
    const c = s.coverage;
    fail(unique(c.expected_countries) && unique(c.captured_countries) && c.captured_countries.every(x => c.expected_countries.includes(x)), 'Invalid coverage set');
    fail(c.status !== 'complete' || c.expected_countries.length === c.captured_countries.length, 'Complete label disagrees with coverage');
    const artists = new Set(s.artists.map(a => a.id)), songs = new Set(s.songs.map(a => a.id));
    fail(artists.size === s.artists.length && songs.size === s.songs.length, 'Duplicate identity');
    for (const row of s.songs) {
        fail(row.artist_ids.every(a => artists.has(a)), 'Unknown K-pop artist');
        const u = new URL(row.source_url);
        fail(row.source_url === `https://rotation.today/song/${row.id}` && u.pathname === `/song/${row.id}` && u.href === row.source_url && !u.search, 'Song/source identity mismatch');
    }
    const seen = new Set(), songCountries = new Set();
    for (const row of s.entries) {
        fail(songs.has(row.song_id) && c.captured_countries.includes(row.country), 'Orphan observation');
        fail(row.source_date === s.source_date && row.source_url === `https://rotation.today/map?market=${row.country}`, 'Country/date source mismatch');
        const key = `${row.country}:${row.position}`;
        fail(!seen.has(key), 'Duplicate country position');
        seen.add(key);
        const songCountry = `${row.song_id}:${row.country}`;
        fail(!songCountries.has(songCountry), 'Duplicate song/country observation');
        songCountries.add(songCountry);
    }
    fail(s.songs.every(row => s.entries.some(e => e.song_id === row.id)), 'Song without observation');
    return s;
}
export function orderedWeeks(weeks) { const dates = new Set(); return weeks.map(validateWeekly).sort((a, b) => a.edition_date.localeCompare(b.edition_date)).map(s => { if (dates.has(s.edition_date))
    throw Error('Duplicate edition: corrections must be explicit'); dates.add(s.edition_date); return s; }); }
