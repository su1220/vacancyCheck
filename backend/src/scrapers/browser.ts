import { chromium, Browser } from 'playwright';

// サーバー全体で共有するブラウザインスタンス
let sharedBrowser: Browser | null = null;

// ブラウザインスタンスを取得（なければ起動）
export async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    console.log('[browser] ブラウザを起動します');
    sharedBrowser = await chromium.launch({
      headless: true,
      // Linuxサーバー（Renderなど）ではサンドボックスを無効化する必要がある
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return sharedBrowser;
}

// サーバー起動時にブラウザを事前起動する
export async function initBrowser(): Promise<void> {
  await getBrowser();
  console.log('[browser] ブラウザの事前起動完了');
}
