export type ImageOption = {
  id: string
  src: string
  label: string
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const DEFAULT_IMAGES: ImageOption[] = [
  {
    id: 'builtin-1',
    src: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4d9d"/>
      <stop offset="0.5" stop-color="#a855f7"/>
      <stop offset="1" stop-color="#22c55e"/>
    </linearGradient>
    <radialGradient id="glow" cx="35%" cy="30%" r="60%">
      <stop offset="0" stop-color="rgba(255,255,255,0.85)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="360" cy="300" r="420" fill="url(#glow)"/>
  <g opacity="0.9">
    <path d="M120 760 C 260 620, 420 900, 560 760 S 860 620, 940 760" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="22" stroke-linecap="round"/>
    <path d="M120 860 C 280 740, 440 980, 600 860 S 860 740, 940 860" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="14" stroke-linecap="round"/>
  </g>
  <g opacity="0.9">
    <rect x="90" y="110" width="220" height="220" rx="38" fill="rgba(255,255,255,0.22)"/>
    <rect x="714" y="140" width="220" height="220" rx="38" fill="rgba(255,255,255,0.18)"/>
    <rect x="660" y="650" width="280" height="260" rx="44" fill="rgba(0,0,0,0.10)"/>
  </g>
</svg>`),
    label: '内置渐变 1',
  },
  {
    id: 'builtin-2',
    src: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0ea5e9"/>
      <stop offset="0.55" stop-color="#22c55e"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <pattern id="p" width="96" height="96" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
      <rect width="96" height="96" fill="rgba(255,255,255,0.0)"/>
      <circle cx="22" cy="24" r="10" fill="rgba(255,255,255,0.28)"/>
      <circle cx="72" cy="64" r="14" fill="rgba(0,0,0,0.12)"/>
      <path d="M10 74 L 44 40 L 78 74" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </pattern>
  </defs>
  <rect width="1024" height="1024" fill="url(#g1)"/>
  <rect width="1024" height="1024" fill="url(#p)"/>
  <g opacity="0.9">
    <circle cx="780" cy="260" r="170" fill="rgba(255,255,255,0.18)"/>
    <circle cx="300" cy="770" r="240" fill="rgba(255,255,255,0.14)"/>
    <path d="M160 230 C 260 140, 420 140, 520 230 S 780 320, 900 240" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="20" stroke-linecap="round"/>
  </g>
</svg>`),
    label: '内置图案 2',
  },
  {
    id: 'image-1',
    src: 'https://ac35844.webp.li/image%20(1).jpg',
    label: '图片 1',
  },
  {
    id: 'image-2',
    src: 'https://ac35844.webp.li/image%20(2).jpg',
    label: '图片 2',
  },
  {
    id: 'image-3',
    src: 'https://ac35844.webp.li/image%20(3).jpg',
    label: '图片 3',
  },
  {
    id: 'image-5',
    src: 'https://ac35844.webp.li/image%20(5).jpg',
    label: '图片 5',
  },
  {
    id: 'image-7',
    src: 'https://ac35844.webp.li/image%20(7).jpg',
    label: '图片 7',
  },
  {
    id: 'image-4',
    src: 'https://ac35844.webp.li/image%20(4).jpg',
    label: '图片 4',
  },
  {
    id: 'image-8',
    src: 'https://ac35844.webp.li/image%20(8).jpg',
    label: '图片 8',
  },
  {
    id: 'image-10',
    src: 'https://ac35844.webp.li/image%20(10).jpg',
    label: '图片 10',
  },
  {
    id: 'image-9',
    src: 'https://ac35844.webp.li/image%20(9).jpg',
    label: '图片 9',
  },
  {
    id: 'image-11',
    src: 'https://ac35844.webp.li/image%20(11).jpg',
    label: '图片 11',
  },
  {
    id: 'image-6',
    src: 'https://ac35844.webp.li/image%20(6).jpg',
    label: '图片 6',
  },
  {
    id: 'image-13',
    src: 'https://ac35844.webp.li/image%20(13).jpg',
    label: '图片 13',
  },
  {
    id: 'image-12',
    src: 'https://ac35844.webp.li/image%20(12).jpg',
    label: '图片 12',
  },
  {
    id: 'image-15',
    src: 'https://ac35844.webp.li/image%20(15).jpg',
    label: '图片 15',
  },
  {
    id: 'image-14',
    src: 'https://ac35844.webp.li/image%20(14).jpg',
    label: '图片 14',
  },
  {
    id: 'image-17',
    src: 'https://ac35844.webp.li/image%20(17).jpg',
    label: '图片 17',
  },
  {
    id: 'image-16',
    src: 'https://ac35844.webp.li/image%20(16).jpg',
    label: '图片 16',
  },
  {
    id: 'pixar-girl-1',
    src: 'https://ac35844.webp.li/liexpress_Pixar-style_four-year-old_Chinese_girl_sitting_on_the_3b54a551-7921-4ee4-ac4f-19bba982a2f2.png',
    label: '女孩（皮克斯风）1',
  },
  {
    id: 'pixar-girl-2',
    src: 'https://ac35844.webp.li/liexpress_Pixar-style_four-year-old_Chinese_girl_sitting_on_the_2aaaf338-3b1f-46c2-9ea2-94085d94f849.png',
    label: '女孩（皮克斯风）2',
  },
  {
    id: 'wechat-20250419075853',
    src: 'https://ac35844.webp.li/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250419075853.jpg',
    label: '微信图 20250419075853',
  },
  {
    id: '675d7939',
    src: 'https://ac35844.webp.li/675d7939-4527-4d37-98fe-c853439478c4.png',
    label: '插画 675d7939',
  },
  {
    id: 'dc7900a1',
    src: 'https://ac35844.webp.li/dc7900a1-9ff8-4cf1-9ff0-621b191e41d3.png',
    label: '插画 dc7900a1',
  },
  {
    id: 'a0cc0caa',
    src: 'https://ac35844.webp.li/a0cc0caa-72ea-4b07-9537-d927320a2d5a.png',
    label: '插画 a0cc0caa',
  },
  {
    id: 'wechat-20250413231248',
    src: 'https://ac35844.webp.li/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250413231248.png',
    label: '微信图 20250413231248',
  },
  {
    id: 'mother-and-girl',
    src: 'https://ac35844.webp.li/liexpress_A_30-year-old_Chinese_intellectual_mother_and_her_3-y_180a4d76-b6fd-439f-8b12-fe8263ec79b3.png',
    label: '妈妈和女孩',
  },
  {
    id: 'gf9t-xdlb',
    src: 'https://ac35844.webp.li/Gf9tXdlbYAA50L1.jfif',
    label: '照片 1',
  },
  {
    id: 'gf9f-zdnak',
    src: 'https://ac35844.webp.li/Gf9fZDnakAATyke.jfif',
    label: '照片 2',
  },
  {
    id: 'gf9f-yyr',
    src: 'https://ac35844.webp.li/Gf9fYYRa0AAE4R4.jfif',
    label: '照片 3',
  },
  {
    id: 'gf9t-xdtb',
    src: 'https://ac35844.webp.li/Gf9tXdtbAAAny_N.jfif',
    label: '照片 4',
  },
  {
    id: 'magic-girl',
    src: 'https://ac35844.webp.li/liexpress_Magic_girl_wand_forest_rabbit_d298a05d-bf53-4137-895a-852c8fb246af.png',
    label: '魔法少女',
  },
  {
    id: 'girl-park',
    src: 'https://ac35844.webp.li/liexpress_A_3-year-old_Chinese_girl_walking_outdoors_in_a_park__a0701788-b54a-483b-a00d-78b8c5a2fe95.png',
    label: '公园散步',
  },
  {
    id: 'girl-indoor-1',
    src: 'https://ac35844.webp.li/liexpress_A_3-year-old_Chinese_girl_standing_indoors_in_front_o_835b94d6-c0a0-4192-819a-3cfb4c6d724d.png',
    label: '室内 1',
  },
  {
    id: 'girl-indoor-2',
    src: 'https://ac35844.webp.li/liexpress_A_3-year-old_Chinese_girl_standing_indoors_in_front_o_0e4d3ddc-044c-49c6-9cdc-33c78fdecc21.png',
    label: '室内 2',
  },
]
