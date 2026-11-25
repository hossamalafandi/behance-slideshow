'use strict';

const DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';

const PAGE_TITLE = 'Cellphone Store — Hossam Alafandi';
const PAGE_CODE = 'cellphone-store';
// Fixed Behance height, sized to cover both the 987 px desktop column and the
// 390 px phone column without clipping the long stage/media layout.
const EMBED_HEIGHT = 13320;
const EMBED_WIDTH = '100%';
const PRODUCTION_ASSET_BASE =
  'https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/cellphone-store/';
const PREVIEW_ASSET_BASE = '/assets/cellphone-store/';

const HERO = {
  file: 'hero',
  alt: 'Cellphone Store interior',
  title: 'CELLPHONE STORE',
  location: 'SYRIA, HAMA',
  year: '- 2026 -'
};

const OVERVIEW_TEXT =
  'This 13 m² cellphone store was renovated and reconfigured from a former thrift shop ' +
  'in poor condition into a modern retail space. The project involved extensive repairs ' +
  'and a comprehensive redesign to accommodate the functional requirements of a cellphone ' +
  'store within a highly limited area. The design prioritized space optimization, ' +
  'functionality, and operational efficiency, with careful consideration of display ' +
  'integration, circulation, customer capacity, and staff convenience. The result is a ' +
  'compact, contemporary retail environment that maximizes the potential of every square ' +
  'meter without compromising usability or visual appeal.';

function video(name, id, title) {
  return {
    name: name,
    id: id,
    title: title || name,
    embed: 'https://player.vimeo.com/video/' + id +
      '?dnt=1&title=0&byline=0&portrait=0'
  };
}

const STAGES = [
  {
    id: 'inspecting',
    title: '1-Inspecting',
    text:
      'The existing electrical and plumbing systems were assessed to determine what could ' +
      'be retained or required modification. Site measurements were taken to evaluate the ' +
      'layout and identify opportunities to improve space utilization and functionality. ' +
      'A key decision was to replace the existing spiral staircase, which occupied ' +
      'approximately 13% of the store’s floor area, with a more compact alternative to ' +
      'maximize usable retail space.',
    media: 'video-images',
    videos: [video('IMG_3040', '1245908917', '1-Inspecting — IMG_3040')],
    images: ['stage1-1', 'stage1-2', 'stage1-4', 'stage1-3']
  },
  {
    id: 'planning',
    title: '2-Planning and Desgining',
    text:
      'Detailed designs, 3D cabinet modeling and visualization, technical drawings, and ' +
      'shop drawings were developed for the store’s custom cabinetry, including drawer and ' +
      'door mechanisms. Every element was carefully planned to maximize space utilization ' +
      'and functionality. The design was refined through detailed client consultations, ' +
      'ensuring all requirements were addressed before the final proposal received formal ' +
      'approval.',
    media: 'slideshow-drawing',
    drawing: 'stage2-1'
  },
  {
    id: 'site-preparation',
    title: '3-Site Preperation',
    text:
      'The space was cleared of existing contents, fixtures, and the old shopfront and ' +
      'glazing to prepare for renovation. The upper floor was designated for storage, with ' +
      'an additional WC incorporated into the layout at the client\'s request, requiring ' +
      'further plumbing provisions and modifications.',
    media: 'videos',
    videos: [
      video('IMG_3208', '1245909044', '3-Site Preperation — IMG_3208'),
      video('IMG_3211', '1245909094', '3-Site Preperation — IMG_3211')
    ]
  },
  {
    id: 'electricity',
    title: '4-Electricty',
    text:
      'Following the detailed planning phase, gypsum board ceiling installation, lighting ' +
      'layouts, and electrical outlets were implemented according to the approved CAD ' +
      'drawings. Accurate site measurements ensured precise coordination between the design ' +
      'and on-site execution, minimizing errors and maintaining alignment with the planned ' +
      'layout.',
    media: 'videos',
    videos: [
      video('IMG_3219 3', '1245909398', '4-Electricty — IMG_3219 3'),
      video('IMG_3231', '1245912603', '4-Electricty — IMG_3231')
    ]
  },
  {
    id: 'flooring',
    title: '5-Flooring',
    text:
      'Following the completion of electrical and plumbing works, flooring works commenced. ' +
      'Materials were carefully selected to complement the store’s modern design while ' +
      'ensuring durability, reliability, and suitability for daily commercial use.',
    media: 'groups',
    groups: [
      {
        video: video('IMG_3314', '1245912647', '5-Flooring — IMG_3314'),
        images: ['stage5a-1', 'stage5a-2', 'stage5a-3', 'stage5a-4']
      },
      {
        video: video('IMG_3823', '1245912852', '5-Flooring — IMG_3823'),
        images: ['stage5b-1', 'stage5b-2', 'stage5b-3', 'stage5b-4']
      }
    ]
  },
  {
    id: 'cabinetry',
    title: '6-Cabinetry Works',
    text:
      'The store began to take shape as custom cabinetry work progressed. Each stage was ' +
      'carefully inspected, with minor on-site adjustments made to accommodate actual site ' +
      'conditions while maintaining the original design intent. Materials and finishes were ' +
      'selected to achieve the intended aesthetic while ensuring functionality and durability.',
    media: 'videos',
    videos: [
      video('IMG_4098', '1245913033', '6-Cabinetry Works — IMG_4098'),
      video('IMG_4100', '1245913587', '6-Cabinetry Works — IMG_4100')
    ]
  },
  {
    id: 'finalizing',
    title: '7-Finalizing',
    text:
      'The final stage focused on installing the remaining elements, including tables and ' +
      'shelving, while addressing outstanding cabinetry adjustments and on-site issues. ' +
      'With the final details completed, the store came together as a cohesive, modern ' +
      'retail space, maximizing the potential of its 13 m² area through thoughtful design, ' +
      'efficient planning, and careful attention to functionality.',
    media: 'text'
  }
];

const RENDERS = [
  'C9xftbD', 'TauRfiT', 'SFKlaHV', 'b1Ruxrm', 'giTrAnr', 'SWfGA67',
  'i756vHj', 'xuPgtcD', '1PdJEKU', 'jmLU6pQ', 'GWoGGan'
];

function renderUrl(id) {
  return 'https://i.imgur.com/' + id + '.jpg';
}

function renderThumbUrl(id) {
  return 'https://i.imgur.com/' + id + 'h.jpg';
}

const REALITY = [
  { render: 'reality-1-render', photo: 'reality-1-photo',
    alt: 'Render and reality comparison 1' },
  { render: 'reality-2-render', photo: 'reality-2-photo',
    alt: 'Render and reality comparison 2' },
  { render: 'reality-3-render', photo: 'reality-3-photo',
    alt: 'Render and reality comparison 3' },
  { render: 'reality-4-render', photo: 'reality-4-photo',
    alt: 'Render and reality comparison 4' }
];

const MAP_URL =
  'https://maps-api-ssl.google.com/maps?hl=en-US&ll=35.133634,36.752241&output=embed&q=35.133655,36.752207&z=21';

const TOOLS = [
  { name: '3ds Max', id: 'znQK1ti' },
  { name: 'AutoCAD', id: 'eusbdWx' },
  { name: 'Corona', id: 'X4WSOcP' },
  { name: 'Photoshop', id: '6sW1ghq' }
];

function toolUrl(id) {
  return 'https://i.imgur.com/' + id + '.png';
}

const COPYRIGHT_TEXT = '© 2025 HOSSAM ALAFANDI. All rights reserved.';

function assetUrl(base, name, size) {
  return base + name + '-' + size + '.jpg';
}

function embedUrl(deploymentId) {
  return 'https://script.google.com/macros/s/' +
    (deploymentId || DEPLOYMENT_ID) + '/exec?page=' + PAGE_CODE;
}

function embedSnippet(deploymentId) {
  return [
    '<iframe',
    '  src="' + embedUrl(deploymentId) + '"',
    '  width="' + EMBED_WIDTH + '"',
    '  height="' + EMBED_HEIGHT + '"',
    '  style="border:0;overflow:hidden"',
    '  loading="lazy"',
    '  allowfullscreen',
    '  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">',
    '</iframe>'
  ].join('\n');
}

module.exports = {
  DEPLOYMENT_ID,
  PAGE_TITLE,
  PAGE_CODE,
  EMBED_HEIGHT,
  EMBED_WIDTH,
  PRODUCTION_ASSET_BASE,
  PREVIEW_ASSET_BASE,
  HERO,
  OVERVIEW_TEXT,
  STAGES,
  RENDERS,
  renderUrl,
  renderThumbUrl,
  REALITY,
  MAP_URL,
  TOOLS,
  toolUrl,
  COPYRIGHT_TEXT,
  assetUrl,
  embedUrl,
  embedSnippet
};
