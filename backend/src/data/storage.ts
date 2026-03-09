import fs from 'fs';
import path from 'path';
import { Facility, VacancyResult } from '../types/index';

const DATA_DIR = path.join(__dirname, '../../data');
const FACILITIES_FILE = path.join(DATA_DIR, 'facilities.json');
const VACANCY_FILE = path.join(DATA_DIR, 'vacancy.json');

// データディレクトリの初期化
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 施設データの読み込み
export function loadFacilities(): Facility[] {
  ensureDataDir();
  if (!fs.existsSync(FACILITIES_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(FACILITIES_FILE, 'utf-8');
  return JSON.parse(raw) as Facility[];
}

// 施設データの保存
export function saveFacilities(facilities: Facility[]): void {
  ensureDataDir();
  fs.writeFileSync(FACILITIES_FILE, JSON.stringify(facilities, null, 2), 'utf-8');
}

// 空室データの読み込み（全件）
export function loadVacancyResults(): Record<string, VacancyResult> {
  ensureDataDir();
  if (!fs.existsSync(VACANCY_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(VACANCY_FILE, 'utf-8');
  return JSON.parse(raw) as Record<string, VacancyResult>;
}

// 空室データの保存（施設IDをキーとして保存）
export function saveVacancyResult(result: VacancyResult): void {
  ensureDataDir();
  const all = loadVacancyResults();
  all[result.facilityId] = result;
  fs.writeFileSync(VACANCY_FILE, JSON.stringify(all, null, 2), 'utf-8');
}

// 特定施設の空室データ取得
export function getVacancyResult(facilityId: string): VacancyResult | null {
  const all = loadVacancyResults();
  return all[facilityId] ?? null;
}
