// High quality procedural photographic samples for lithophane testing
// Renders rich gradients, highlights, deep blacks, and fine edge contrasts
// ensuring zero external network dependencies and immediate offline functionality.

export interface SamplePreset {
  id: string;
  title: string;
  subtitle: string;
  category: 'Romantic' | 'Family' | 'Pet' | 'Baby' | 'Art';
  generateDataUrl: () => string;
}

export function createSunsetCoupleImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Sky gradient - sunset tones with high contrast for lithophane
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 800);
  skyGrad.addColorStop(0, '#100a1c');
  skyGrad.addColorStop(0.3, '#5c244c');
  skyGrad.addColorStop(0.55, '#d45745');
  skyGrad.addColorStop(0.75, '#f6af65');
  skyGrad.addColorStop(0.9, '#fff2c6');
  skyGrad.addColorStop(1.0, '#361b2d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 600, 800);

  // Glowing Sun disc (very bright, so very thin/translucent in lithophane)
  const sunX = 300;
  const sunY = 510;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
  sunGlow.addColorStop(0, '#ffffff');
  sunGlow.addColorStop(0.2, '#fff7d9');
  sunGlow.addColorStop(0.6, 'rgba(255, 190, 110, 0.7)');
  sunGlow.addColorStop(1, 'rgba(240, 120, 60, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
  ctx.fill();

  // Water reflection ripples
  const waterGrad = ctx.createLinearGradient(0, 620, 0, 800);
  waterGrad.addColorStop(0, '#2d142c');
  waterGrad.addColorStop(1, '#0b040e');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 620, 600, 180);

  // Reflection streaks
  ctx.fillStyle = 'rgba(255, 230, 170, 0.35)';
  for (let y = 625; y < 790; y += 7) {
    const w = 40 + (y - 620) * 1.8 + Math.sin(y * 0.4) * 15;
    ctx.fillRect(sunX - w / 2, y, w, 3);
  }

  // Hill / Shoreline silhouette
  ctx.fillStyle = '#080309';
  ctx.beginPath();
  ctx.moveTo(0, 620);
  ctx.bezierCurveTo(150, 610, 450, 630, 600, 620);
  ctx.lineTo(600, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Couple silhouette standing together
  // Figure 1 (Left - Man)
  ctx.fillStyle = '#050207';
  // Head
  ctx.beginPath();
  ctx.arc(260, 480, 24, 0, Math.PI * 2);
  ctx.fill();
  // Body & shoulders
  ctx.beginPath();
  ctx.moveTo(235, 620);
  ctx.lineTo(245, 520);
  ctx.bezierCurveTo(248, 505, 275, 505, 280, 520);
  ctx.lineTo(290, 620);
  ctx.closePath();
  ctx.fill();

  // Figure 2 (Right - Woman, leaning gently)
  // Head
  ctx.beginPath();
  ctx.arc(312, 495, 21, 0, Math.PI * 2);
  ctx.fill();
  // Hair flowing
  ctx.beginPath();
  ctx.ellipse(322, 510, 14, 28, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Torso & dress
  ctx.beginPath();
  ctx.moveTo(280, 620);
  ctx.lineTo(295, 525);
  ctx.bezierCurveTo(300, 515, 328, 515, 330, 530);
  ctx.lineTo(355, 620);
  ctx.closePath();
  ctx.fill();

  // Gentle heart glow above them
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.fillText('❤', 288, 435);

  // Foliage framing branch on top right
  ctx.fillStyle = '#070208';
  ctx.beginPath();
  ctx.moveTo(600, 0);
  ctx.bezierCurveTo(450, 40, 420, 120, 380, 140);
  ctx.lineWidth = 14;
  ctx.stroke();
  for (let i = 0; i < 22; i++) {
    const lx = 420 + Math.random() * 160;
    const ly = 30 + Math.random() * 140;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 18, 9, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createPetDogImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Soft outdoor background gradient
  const bg = ctx.createRadialGradient(300, 400, 80, 300, 400, 450);
  bg.addColorStop(0, '#f2ece4');
  bg.addColorStop(0.5, '#c9b7a2');
  bg.addColorStop(1, '#4e3e34');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 800);

  // Soft bokeh circles
  for (let i = 0; i < 18; i++) {
    const x = Math.sin(i * 1.7) * 220 + 300;
    const y = Math.cos(i * 2.3) * 300 + 400;
    const r = 25 + (i % 5) * 15;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (i % 3) * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dog portrait head & shoulders
  // Ears
  ctx.fillStyle = '#3a271b';
  ctx.beginPath();
  ctx.ellipse(190, 360, 45, 95, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(410, 360, 45, 95, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Head base
  ctx.fillStyle = '#c7986c';
  ctx.beginPath();
  ctx.ellipse(300, 410, 130, 140, 0, 0, Math.PI * 2);
  ctx.fill();

  // White snout blaze & chest
  ctx.fillStyle = '#f8f4ed';
  ctx.beginPath();
  ctx.ellipse(300, 460, 58, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(280, 310);
  ctx.lineTo(320, 310);
  ctx.lineTo(315, 430);
  ctx.lineTo(285, 430);
  ctx.closePath();
  ctx.fill();

  // Dog dark eyes with glowing lifelike catchlights
  ctx.fillStyle = '#1c1109';
  ctx.beginPath();
  ctx.ellipse(245, 380, 20, 22, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(355, 380, 20, 22, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights (creates intense realistic depth in lithophane)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(241, 374, 6, 0, Math.PI * 2);
  ctx.arc(351, 374, 6, 0, Math.PI * 2);
  ctx.fill();

  // Dog nose
  ctx.fillStyle = '#120c08';
  ctx.beginPath();
  ctx.ellipse(300, 470, 32, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose highlight
  ctx.fillStyle = '#7a6659';
  ctx.beginPath();
  ctx.ellipse(300, 465, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth line
  ctx.strokeStyle = '#120c08';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(300, 492);
  ctx.lineTo(300, 510);
  ctx.moveTo(300, 510);
  ctx.quadraticCurveTo(270, 525, 250, 515);
  ctx.moveTo(300, 510);
  ctx.quadraticCurveTo(330, 525, 350, 515);
  ctx.stroke();

  // Pink tongue
  ctx.fillStyle = '#e86f88';
  ctx.beginPath();
  ctx.ellipse(300, 535, 22, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body / neck
  ctx.fillStyle = '#b88554';
  ctx.beginPath();
  ctx.moveTo(180, 550);
  ctx.lineTo(120, 800);
  ctx.lineTo(480, 800);
  ctx.lineTo(420, 550);
  ctx.closePath();
  ctx.fill();

  // White chest bib
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(250, 540);
  ctx.lineTo(200, 800);
  ctx.lineTo(400, 800);
  ctx.lineTo(350, 540);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createBabyImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Dreamy cloud pastel gradient
  const bg = ctx.createLinearGradient(0, 0, 600, 800);
  bg.addColorStop(0, '#fefbf3');
  bg.addColorStop(0.4, '#f7e7da');
  bg.addColorStop(1, '#debca8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 800);

  // Soft glow vignette
  const rad = ctx.createRadialGradient(300, 420, 60, 300, 420, 380);
  rad.addColorStop(0, '#ffffff');
  rad.addColorStop(0.7, 'rgba(255, 245, 235, 0.4)');
  rad.addColorStop(1, 'rgba(150, 110, 85, 0.4)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 600, 800);

  // Sleeping baby sleeping on cloud blanket
  // Blanket folds
  ctx.fillStyle = '#fcf8f2';
  ctx.beginPath();
  ctx.ellipse(300, 580, 240, 140, 0, 0, Math.PI * 2);
  ctx.fill();

  // Baby head
  ctx.fillStyle = '#fae1cf';
  ctx.beginPath();
  ctx.arc(300, 400, 110, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(240, 140, 140, 0.35)';
  ctx.beginPath();
  ctx.arc(240, 430, 35, 0, Math.PI * 2);
  ctx.arc(360, 430, 35, 0, Math.PI * 2);
  ctx.fill();

  // Sleeping closed eyelashes
  ctx.strokeStyle = '#4a2c1f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(250, 395, 22, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(350, 395, 22, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Eyelash ticks
  for (let i = -2; i <= 2; i++) {
    const angle1 = Math.PI * 0.5 + i * 0.2;
    ctx.beginPath();
    ctx.moveTo(250 + Math.cos(angle1) * 22, 395 + Math.sin(angle1) * 22);
    ctx.lineTo(250 + Math.cos(angle1) * 28, 395 + Math.sin(angle1) * 28);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(350 + Math.cos(angle1) * 22, 395 + Math.sin(angle1) * 22);
    ctx.lineTo(350 + Math.cos(angle1) * 28, 395 + Math.sin(angle1) * 28);
    ctx.stroke();
  }

  // Button nose
  ctx.fillStyle = '#e8a994';
  ctx.beginPath();
  ctx.arc(300, 425, 10, 0, Math.PI * 2);
  ctx.fill();

  // Sweet gentle smile
  ctx.strokeStyle = '#c06b5b';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(300, 450, 24, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Knitted bonnet / beanie hat
  ctx.fillStyle = '#b5c8d6';
  ctx.beginPath();
  ctx.arc(300, 380, 115, Math.PI * 0.88, Math.PI * 2.12);
  ctx.closePath();
  ctx.fill();

  // Pom pom on beanie
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(300, 240, 30, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createFamilyPortraitImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Warm studio backdrop with light texture
  const bg = ctx.createRadialGradient(300, 360, 40, 300, 360, 460);
  bg.addColorStop(0, '#f9f6ee');
  bg.addColorStop(0.5, '#c7ab91');
  bg.addColorStop(1, '#2f2017');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 800);

  // Dad, Mom & Child silhouette arrangement
  ctx.fillStyle = '#110b07';

  // Dad (Left)
  ctx.beginPath();
  ctx.arc(200, 330, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(140, 650);
  ctx.lineTo(165, 410);
  ctx.quadraticCurveTo(200, 385, 235, 410);
  ctx.lineTo(260, 650);
  ctx.closePath();
  ctx.fill();

  // Mom (Right)
  ctx.beginPath();
  ctx.arc(395, 350, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(335, 650);
  ctx.lineTo(365, 425);
  ctx.quadraticCurveTo(395, 405, 425, 425);
  ctx.lineTo(460, 650);
  ctx.closePath();
  ctx.fill();

  // Child in center on shoulders or held
  ctx.beginPath();
  ctx.arc(300, 440, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(250, 650);
  ctx.lineTo(275, 495);
  ctx.quadraticCurveTo(300, 480, 325, 495);
  ctx.lineTo(350, 650);
  ctx.closePath();
  ctx.fill();

  // Festive warm string lights across top
  ctx.strokeStyle = 'rgba(255, 235, 180, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.quadraticCurveTo(300, 170, 600, 90);
  ctx.stroke();

  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const lx = t * 600;
    const ly = (1 - t) * (1 - t) * 100 + 2 * (1 - t) * t * 170 + t * t * 90;

    const bulbGlow = ctx.createRadialGradient(lx, ly + 8, 2, lx, ly + 8, 22);
    bulbGlow.addColorStop(0, '#ffffff');
    bulbGlow.addColorStop(0.3, '#ffdf78');
    bulbGlow.addColorStop(1, 'rgba(255, 180, 60, 0)');
    ctx.fillStyle = bulbGlow;
    ctx.beginPath();
    ctx.arc(lx, ly + 8, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'sunset_couple',
    title: 'Sunset Romance',
    subtitle: 'High contrast silhouettes & warm glowing horizon',
    category: 'Romantic',
    generateDataUrl: createSunsetCoupleImage,
  },
  {
    id: 'pet_dog',
    title: 'Playful Golden Pet',
    subtitle: 'Rich fur texture and lifelike catchlight eyes',
    category: 'Pet',
    generateDataUrl: createPetDogImage,
  },
  {
    id: 'baby_dream',
    title: 'Sweet Newborn Smile',
    subtitle: 'Soft gentle gradients and sweet peaceful detail',
    category: 'Baby',
    generateDataUrl: createBabyImage,
  },
  {
    id: 'family_warmth',
    title: 'Beloved Family Portrait',
    subtitle: 'Three silhouettes framed with warm festival lights',
    category: 'Family',
    generateDataUrl: createFamilyPortraitImage,
  },
];
