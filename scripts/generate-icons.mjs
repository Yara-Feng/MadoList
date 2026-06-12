/**
 * MadoList TabBar 图标生成器
 *
 * 来源：Remix Icon (Apache 2.0 License)
 * 风格统一：Line（线性）→ 未选中态  /  Fill（填充）→ 选中态
 * 尺寸：81×81 px PNG
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, 'node_modules', 'remixicon', 'icons');
const TAB_DIR = join(__dirname, '..', 'miniprogram', 'images', 'tab');
const SIZE = 81;

// 图标映射：{ 文件名前缀: [未选中(line)目录, 选中(fill)目录] }
const ICONS = {
  home:     { dir: 'Buildings',      name: 'home' },
  tasks:    { dir: 'Document',       name: 'task' },
  calendar: { dir: 'Business',       name: 'calendar' },
  profile:  { dir: 'User & Faces',   name: 'user' },
};

const TAB_LABELS = { home: '首页', tasks: '待办', calendar: '日历', profile: '我的' };

/**
 * 调整 SVG 颜色
 */
function colorize(svg, color) {
  return svg
    .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
    .replace('<svg', `<svg color="${color}"`);
}

/**
 * SVG → PNG Buffer
 */
function svgToPng(svgContent, color) {
  const colored = colorize(svgContent, color);
  const resvg = new Resvg(colored, {
    fitTo: { mode: 'width', value: SIZE },
    background: 'rgba(0,0,0,0)',
  });
  return resvg.render().asPng();
}

function main() {
  console.log('🎨 MadoList TabBar 图标生成\n');
  console.log('📦 Remix Icon v4.9.0 (Apache 2.0)');
  console.log('📐 尺寸: 81×81 px 透明 PNG');
  console.log('🎨 #999999 灰(未选中) → #0052D9 蓝(选中)\n');

  mkdirSync(TAB_DIR, { recursive: true });

  let totalBytes = 0;

  for (const [key, { dir, name }] of Object.entries(ICONS)) {
    console.log(`📌 ${TAB_LABELS[key]} (${key}):`);
    try {
      // 未选中态 - Line 图标，灰色 #999999
      const linePath = join(ICONS_DIR, dir, `${name}-line.svg`);
      const lineSvg = readFileSync(linePath, 'utf-8');
      const linePng = svgToPng(lineSvg, '#999999');
      writeFileSync(join(TAB_DIR, `${key}.png`), linePng);
      console.log(`  ✅ ${key}.png → ${linePng.length} bytes`);
      totalBytes += linePng.length;

      // 选中态 - Fill 图标，品牌蓝 #0052D9
      const fillPath = join(ICONS_DIR, dir, `${name}-fill.svg`);
      const fillSvg = readFileSync(fillPath, 'utf-8');
      const fillPng = svgToPng(fillSvg, '#0052D9');
      writeFileSync(join(TAB_DIR, `${key}-active.png`), fillPng);
      console.log(`  ✅ ${key}-active.png → ${fillPng.length} bytes`);
      totalBytes += fillPng.length;
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
    }
  }

  console.log(`\n✅ 完成！共生成 8 个图标，${(totalBytes / 1024).toFixed(1)} KB`);
  console.log(`📁 ${TAB_DIR}`);
}

main();
