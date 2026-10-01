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
 if(missing) box.append(node('small','התמונה אינה זמינה: '+missing));
 return box;
}
function imageFigure(filename, caption, folder='images') {
 const figure=node('figure',undefined,'story-image');
 const src=assetPath(filename,folder,/\.(jpe?g|png|webp)$/i);
 if(!src) figure.append(placeholder(caption,filename));
 else {
 const button=node('button',undefined,'image-button'); button.type='button'; button.setAttribute('aria-label','הגדלת תמונה: '+caption);
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
 const flush=()=>{if(paragraph.length){article.append(node('p',paragraph.join('\n')));paragraph=[];}};
 for(const line of lines.slice(first+1)) {
 const trimmed=line.trim(); const match=trimmed.match(/^\[\[תמונה:\s*([^|]+?)\s*\|\s*(.*?)\]\]$/);
 if(match){flush();article.append(imageFigure(match[1].trim(),match[2]));}
 else if(trimmed.startsWith('תמונה של')){flush();const figure=node('figure',undefined,'story-image');figure.append(placeholder(line));article.append(figure);}
 else if(!trimmed) flush(); else paragraph.push(line);
 }
 flush(); return {article,title};
}
async function readJSON(path) {const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error(path);return response.json();}
async function loadStory() {
 const container=$('#chapters');container.replaceChildren();
 try {
 const files=await readJSON('content/chapters.json');
 if(!Array.isArray(files))throw new Error('manifest');
 const results=await Promise.all(files.map(async(file,i)=>{try{if(!/^chapter-\d+\.txt$/.test(file))throw new Error('path');const response=await fetch('content/'+file,{cache:'no-store'});if(!response.ok)throw new Error(file);return parseChapter(await response.text(),'chapter-'+(i+1));}catch{return {article:node('p','לא ניתן לטעון את הפרק '+(i+1)+'. אפשר לנסות לרענן את העמוד.','status')};}}));
 results.forEach(({article,title})=>{container.append(article);if(title){const a=node('a',title);a.href='#'+article.id;$('#chapter-nav').append(a);}});
 }catch{container.append(node('p','לא ניתן לטעון את הסיפור. יש לפתוח את האתר דרך GitHub Pages או שרת מקומי.','status'));}
 container.setAttribute('aria-busy','false');
}
function fields(card, values) {const dl=node('dl');Object.entries(values).forEach(([label,value])=>{dl.append(node('dt',label),node('dd',value || 'טרם נוסף'));});card.append(dl);}
function externalLink(url,text) {try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))return null;const a=node('a',text);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a;}catch{return null;}}
async function loadArchive() {
 try {
 const data=await readJSON('content/archive.json');
 if(data.hero?.file) $('#hero-image').replaceChildren(imageFigure(data.hero.file,data.hero.caption || 'תמונה משפחתית'));
 const families=data.family?.length?data.family:[{}];
 families.forEach(item=>{const card=node('article',undefined,'card');card.append(item.photo?imageFigure(item.photo,item.name||'תמונת בן משפחה'):placeholder('תמונת בן משפחה'));card.append(node('h3',item.name||'שם בן המשפחה'));fields(card,{'שם בשפת המקור':item.originalName,'שנות לידה ופטירה':item.years,'קשר משפחתי':item.relationship,'הערות':item.notes});$('#family-items').append(card);});
 if(data.timeline?.length)data.timeline.forEach(item=>{const li=node('li');li.append(node('strong',item.year),node('h3',item.title),node('p',item.description));$('#timeline-items').append(li);});else $('#timeline-items').append(node('li','אירועים ותאריכים יתווספו בהמשך.'));
 if(data.photos?.length)data.photos.forEach(item=>$('#photo-items').append(imageFigure(item.file,item.caption||'')));else $('#photo-items').append(placeholder('תמונות משפחתיות יתווספו בהמשך'));
 const documents=data.documents?.length?data.documents:[{}];
 documents.forEach(item=>{const card=node('article',undefined,'card');card.append(node('h3',item.title||'כותרת המסמך'));fields(card,{'שנה':item.year,'מקור / ארכיון':item.source,'תיאור':item.description});if(item.file){if(/\.pdf$/i.test(item.file)){const path=assetPath(item.file,'documents',/\.pdf$/i);if(path){const a=node('a','פתיחת המסמך (PDF)');a.href=path;a.target='_blank';a.rel='noopener';card.append(a);}}else card.append(imageFigure(item.file,item.title||'מסמך','documents'));}else card.append(placeholder('מקום למסמך או PDF'));for(const [key,label] of [['transcription','תמלול'],['translation','תרגום']])if(item[key]){const details=node('details');details.append(node('summary',label),node('p',item[key]));card.append(details);}$('#document-items').append(card);});
 const sources=data.sources?.length?data.sources:[{}];sources.forEach(item=>{const card=node('article',undefined,'card');fields(card,{'ארכיון':item.archive,'אוסף':item.collection,'מספר סימוכין':item.reference,'תיאור':item.description,'הערות':item.notes});const a=externalLink(item.link,'פתיחת המקור');if(a)card.append(a);$('#source-items').append(card);});
 if(data.research) {$('#research-text').replaceChildren();data.research.split(/\n\s*\n/).forEach(p=>$('#research-text').append(node('p',p)));}
 }catch{for(const id of ['family-items','timeline-items','photo-items','document-items','source-items'])$('#'+id).append(node(id==='timeline-items'?'li':'p','התוכן אינו זמין כרגע. אפשר לנסות לרענן את העמוד.','empty'));}
}
loadStory();loadArchive();
