import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Facility, VacancyResult } from '../types/index';

// --- Supabaseクライアント（環境変数が設定されている場合のみ使用） ---

let supabase: SupabaseClient | null = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('[storage] Supabaseストレージを使用します');
} else {
  console.log('[storage] ローカルファイルストレージを使用します');
}

// --- Supabase用ヘルパー ---

async function supabaseGet<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('storage')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return null;
  return data.value as T;
}

async function supabaseSet(key: string, value: unknown): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('storage')
    .upsert({ key, value, updated_at: new Date().toISOString() });
}

// --- ローカルファイル用ヘルパー ---

const DATA_DIR = path.join(__dirname, '../../data');
const FACILITIES_FILE = path.join(DATA_DIR, 'facilities.json');
const VACANCY_FILE = path.join(DATA_DIR, 'vacancy.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function fileRead<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function fileWrite(filePath: string, data: unknown): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// --- 公開API（施設データのみSupabase永続化） ---

// 施設データの読み込み
export async function loadFacilities(): Promise<Facility[]> {
  if (supabase) {
    return (await supabaseGet<Facility[]>('facilities')) ?? [];
  }
  return fileRead<Facility[]>(FACILITIES_FILE, []);
}

// 施設データの保存
export async function saveFacilities(facilities: Facility[]): Promise<void> {
  if (supabase) {
    await supabaseSet('facilities', facilities);
    return;
  }
  fileWrite(FACILITIES_FILE, facilities);
}

// 空室データはファイルのみ（再取得可能なので永続化不要）
export function saveVacancyResult(result: VacancyResult): void {
  const all = fileRead<Record<string, VacancyResult>>(VACANCY_FILE, {});
  all[result.facilityId] = result;
  fileWrite(VACANCY_FILE, all);
}

export function getVacancyResult(facilityId: string): VacancyResult | null {
  const all = fileRead<Record<string, VacancyResult>>(VACANCY_FILE, {});
  return all[facilityId] ?? null;
}
