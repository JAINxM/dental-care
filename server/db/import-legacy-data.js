import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
const sources = ['appointments.json', 'whatsapp_config.json', 'whatsapp_logs.json'];
const removeSource = process.argv.includes('--remove-source');
const client = await pool.connect();

try {
  await client.query('BEGIN');
  for (const source of sources) {
    const file = path.join(dataDir, source);
    let parsed;
    try { parsed = JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw new Error(`Could not parse ${source}: ${error.message}`); }
    const records = Array.isArray(parsed) ? parsed : [parsed];
    for (const [index, record] of records.entries()) {
      await client.query(
        'INSERT INTO legacy_data_archive(source_file,record_index,record) VALUES($1,$2,$3) ON CONFLICT(source_file,record_index) DO NOTHING',
        [source, index, JSON.stringify(record)]
      );
    }
    console.log(`Imported ${records.length} record(s) from ${source}`);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}

for (const source of sources) {
  const file = path.join(dataDir, source);
  try {
    const imported = await pool.query('SELECT count(*)::int count FROM legacy_data_archive WHERE source_file=$1', [source]);
    const original = JSON.parse(await fs.readFile(file, 'utf8'));
    const expected = Array.isArray(original) ? original.length : 1;
    if (imported.rows[0].count < expected) throw new Error(`Archive verification failed for ${source}; source file retained.`);
    if (removeSource) await fs.unlink(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

console.log(removeSource ? 'Legacy JSON source files removed after verified import.' : 'Legacy JSON source files retained.');
await pool.end();
