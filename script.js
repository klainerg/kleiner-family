'use strict';
const $ = (s) => document.querySelector(s);
const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
const lightbox = $('#lightbox');
let lastFocus;
function openImage(src, caption) {
 lastFocus = document.activeElement;
 lightbox.querySelector('img').src = src;
 lightbox.querySelector('img').alt = caption;
 lightbox.querySelector('figcaption').textContent = caption;
 lightbox.showModal(); document.body.classList.add('modal-open');
}
lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', e => { if(e.target === lightbox) { const r=lightbox.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) lightbox.close(); } });
lightbox.addEventListener('close', () => { document.body.classList.remove('modal-open'); lightbox.querySelector('img').removeAttribute('src'); lastFocus?.focus(); });
const menu = $('.menu-toggle');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); $('#navigation').classList.toggle('open', open); });
$('#navigation').addEventListener('click', e => { if(e.target.closest('a')) { menu.setAttribute('aria-expanded','false'); $('#navigation').classList.remove('open'); } });
function assetPath(filename, folder, extensions) {
 if(typeof filename !== 'string' || !filename.trim() || /[\\/]/.test(filename) || !extensions.test(filename)) return null;
 return `assets/${folder}/${encodeURIComponent(filename)}`;
}
function placeholder(description, missing) {
 const box=node('div',undefined,'image-placeholder'); box.append(node('span','◇','frame-symbol'),node('span',description));
 if(missing) box.append(node('small',ui('התמונה אינה זמינה: ','Изображение недоступно: ')+missing));
 return box;
}
function imageFigure(filename, caption, folder='images') {
 const figure=node('figure',undefined,'story-image');
 const src=assetPath(filename,folder,/\.(jpe?g|png|webp)$/i);
 if(!src) figure.append(placeholder(caption,filename));
 else {
 const button=node('button',undefined,'image-button'); button.type='button'; button.setAttribute('aria-label',ui('הגדלת תמונה: ','Увеличить изображение: ')+caption);
 const img=node('img'); img.alt=caption; img.loading='lazy'; img.decoding='async'; img.width=1000; img.height=700;
 img.addEventListener('error',()=>button.replaceWith(placeholder(caption,filename)),{once:true});
 img.src=src; button.append(img); button.addEventListener('click',()=>openImage(src,caption)); figure.append(button);
 }
 figure.append(node('figcaption',caption)); return figure;
}
function parseChapter(text, id) {
 const lines=text.replace(/\r\n?/g,'\n').split('\n');
 const first=lines.findIndex(line=>line.trim());
 if(first<0) return {article:node('article','פרק זה עדיין ריק.','chapter'),title:'פרק ריק'};
 const title=lines[first]; const article=node('article',undefined,'chapter'); article.id=id; article.append(node('h3',title));
 let paragraph=[];
 const flush=()=>{if(paragraph.length){const p=node('p',paragraph.join('\n'));if(id==='chapter-2' && p.textContent.startsWith('בקיץ 1941 חזר האזור'))p.id='deportation-paragraph';article.append(p);paragraph=[];}};
 for(const line of lines.slice(first+1)) {
 const trimmed=line.trim(); const match=trimmed.match(/^\[\[תמונה:\s*([^|]+?)\s*\|\s*(.*?)\]\]$/);
 const link=trimmed.match(/^\[\[קישור:\s*([a-z0-9-]+)\s*\|\s*(.*?)\]\]$/);
 if(link && link[1]==='deportation-route'){flush();const row=node('p',undefined,'supplement-link');const a=node('a',link[2]);a.href='deportation-route.html';row.append(a);article.append(row);}
 else if(match){flush();article.append(imageFigure(match[1].trim(),match[2]));}
 else if(trimmed.startsWith('תמונה של')){flush();const figure=node('figure',undefined,'story-image');figure.append(placeholder(line));article.append(figure);}
 else if(trimmed.startsWith('סוקיריאני →') && trimmed.endsWith('קופייגורוד.')){flush();const route=node('p',line,'route-box');route.dir='rtl';article.append(route);}
 else if(!trimmed) flush(); else paragraph.push(line);
 }
 flush(); return {article,title};
}
async function readJSON(path) {const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error(path);return response.json();}
let currentLanguage = new URLSearchParams(location.search).get('lang') === 'ru' ? 'ru' : 'he';
let storyRequest = 0;
function ui(he, ru) { return currentLanguage === 'ru' ? ru : he; }
function updateLanguageUI() {
 document.documentElement.lang = currentLanguage;
 document.documentElement.dir = currentLanguage === 'ru' ? 'ltr' : 'rtl';
 document.title = ui('שורשי משפחת קליינר','Корни семьи Клейнер');
 $('.brand').replaceChildren(document.createTextNode(ui('קליינר','Клейнер')),node('span',ui('הארכיון המשפחתי','Семейный архив')));
 $('.hero .eyebrow').textContent = ui('הארכיון המשפחתי','Семейный архив');
 $('.hero h1').textContent = document.title;
 $('#navigation a').textContent = ui('הסיפור המשפחתי','История семьи');
 $('.skip').textContent = ui('מעבר לסיפור','Перейти к истории');
 $('#story .eyebrow').textContent = ui('01 / הסיפור','01 / История');
 $('#story h2').textContent = ui('הסיפור המשפחתי','История семьи');
 $('.story-layout aside > span').textContent = ui('פרקי הסיפור','Главы истории');
 $('#chapter-nav').setAttribute('aria-label',ui('פרקי הסיפור','Главы истории'));
 $('.language-switch').setAttribute('aria-label',ui('שפת הסיפור','Язык истории'));
 $('.close-lightbox').textContent = ui('סגירה ×','Закрыть ×');
 $('.close-lightbox').setAttribute('aria-label',ui('סגירת התמונה','Закрыть изображение'));
 lightbox.setAttribute('aria-label',ui('תצוגת תמונה מוגדלת','Увеличенное изображение'));
 const topLink=node('a',ui('חזרה למעלה','Наверх'));topLink.href='#home';
 $('footer').replaceChildren(document.createTextNode(document.title+' '),topLink);
 document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===currentLanguage)));
}
async function loadStory() {
 const request = ++storyRequest;
 const language = currentLanguage;
 updateLanguageUI();
 const container=$('#chapters');container.replaceChildren(node('p',ui('טוען את הסיפור…','Загрузка истории…'),'status'));
 container.setAttribute('aria-busy','true');$('#chapter-nav').replaceChildren();
 try {
 const files=await readJSON(language==='ru'?'content/chapters-ru.json':'content/chapters.json');
 if(!Array.isArray(files))throw new Error('manifest');
 const results=await Promise.all(files.map(async(file,i)=>{
  try {
   if(!/^chapter-\d+(?:-ru)?\.txt$/.test(file))throw new Error('path');
   const response=await fetch('content/'+file,{cache:'no-store'});
   if(!response.ok)throw new Error(file);
   return parseChapter(await response.text(),'chapter-'+(i+1));
  }catch{return {article:node('p',language==='ru'?'Не удалось загрузить главу '+(i+1)+'. Попробуйте обновить страницу.':'לא ניתן לטעון את הפרק '+(i+1)+'. אפשר לנסות לרענן את העמוד.','status')};}
 }));
 if(request!==storyRequest)return;
 container.replaceChildren();
 results.forEach(({article,title})=>{container.append(article);if(title){const a=node('a',title);a.href='#'+article.id;$('#chapter-nav').append(a);}});
 }catch{
 if(request!==storyRequest)return;
 container.replaceChildren(node('p',ui('לא ניתן לטעון את הסיפור. יש לפתוח את האתר דרך GitHub Pages או שרת מקומי.','Не удалось загрузить историю. Откройте сайт через GitHub Pages или локальный сервер.'),'status'));
 }
 container.setAttribute('aria-busy','false');
 if(location.hash){const target=document.getElementById(location.hash.slice(1));if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
}
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{
 if(button.dataset.language===currentLanguage)return;
 currentLanguage=button.dataset.language;
 const url=new URL(location.href);if(currentLanguage==='ru')url.searchParams.set('lang','ru');else url.searchParams.delete('lang');
 history.replaceState(null,'',url);loadStory();
}));
async function loadSupplement() {
 currentLanguage='he';
 const container=$('#supplement-content');
 try {
  const response=await fetch('content/deportation-route.txt',{cache:'no-store'});
  if(!response.ok)throw new Error('article');
  const text=(await response.text()).replace(/\((?:JewishGen|Yad Vashem)\)/g,'');
  const parsed=parseChapter(text,'deportation-route-article');
  const heading=parsed.article.querySelector('h3');
  const h1=node('h1',parsed.title);heading.replaceWith(h1);
  container.replaceChildren(parsed.article);
 }catch{container.replaceChildren(node('p','לא ניתן לטעון את המאמר. אפשר לנסות לרענן את העמוד.','status'));}
 container.setAttribute('aria-busy','false');
}
if($('#supplement-content'))loadSupplement();else loadStory();
