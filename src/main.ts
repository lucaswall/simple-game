import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const ctx = canvas.getContext('2d')!;

canvas.width = 800;
canvas.height = 600;

ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#fff';
ctx.font = '20px sans-serif';
ctx.fillText('Space Game Skeleton', 10, 30);

console.log('Game initialized');
