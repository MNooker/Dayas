"""DA de referencia aprobado por la usuaria. Masters SVG reproducibles."""
from pathlib import Path
import subprocess,re,xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets'
OUT.mkdir(exist_ok=True)
WINE='#762342';IVORY='#f8f5ef'
# La D redonda y el lazo inferior conservan la dirección elegida en la referencia.
# Trazos de estudio que Inkscape convierte a contornos antes de publicarse.
MARK='<g fill="none" stroke="'+WINE+'" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"><path d="M34 47H104C164 47 198 79 198 123C198 170 162 202 104 202H34V47Z"/><path d="M143 202 219 57Q223 48 227 57L299 202M175 140H268"/><path d="M194 153C204 185 202 218 180 224C161 230 146 215 151 199"/></g><path fill="'+WINE+'" d="M151 198 181 146 194 190Z"/>'
def svg(title,art,box):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-labelledby="title"><title id="title">{title}</title>{art}</svg>\n'
def outlined_text(label,font_file,size,tracking,baseline,center):
 f=TTFont(font_file)
 if 'fvar' in f:f=instantiateVariableFont(f,{'wght':400},inplace=False)
 glyphs=f.getGlyphSet();cmap=f.getBestCmap();scale=size/f['head'].unitsPerEm
 advances=[f['hmtx'][cmap[ord(ch)]][0]*scale for ch in label]
 width=sum(advances)+tracking*(len(label)-1);cursor=center-width/2;out=[]
 for ch,advance in zip(label,advances):
  pen=SVGPathPen(glyphs);transform=TransformPen(pen,(scale,0,0,-scale,cursor,baseline));glyphs[cmap[ord(ch)]].draw(transform)
  out.append('<path d="'+pen.getCommands()+'"/>');cursor+=advance+tracking
 return ''.join(out)
word=outlined_text('DAYA',str(OUT/'fonts/playfair-display.woff'),139,13,144,338)
descriptor=outlined_text('CLOTHING',str(OUT/'fonts/dm-sans.woff'),26,10,218,338)
(OUT/'daya-mark.svg').write_text(svg('Daya Clothing · Monograma DA',MARK,'0 0 334 256'))
(OUT/'daya-wordmark.svg').write_text(svg('Daya Clothing',f'<g fill="{WINE}">{word}{descriptor}</g>','0 0 676 256'))
(OUT/'daya-logo-horizontal.svg').write_text(svg('Daya Clothing · Firma horizontal',f'<g transform="translate(0 0)">{MARK}</g><g transform="translate(330 0)"><g fill="{WINE}">{word}{descriptor}</g></g>','0 0 1030 256'))
(OUT/'daya-logo-stacked.svg').write_text(svg('Daya Clothing · Firma vertical',f'<g transform="translate(170 12)">{MARK}</g><g transform="translate(0 278)" fill="{WINE}">{word}{descriptor}</g>','0 0 676 534'))
favicon=f'<rect width="256" height="256" rx="56" fill="{WINE}"/><g transform="translate(12 35) scale(.695)">{MARK.replace(WINE,IVORY)}</g>'
(OUT/'logo.svg').write_text(svg('Daya Clothing · DA',favicon,'0 0 256 256'))
(ROOT/'public/gestion/assets/logo.svg').write_text(svg('Daya Clothing · DA',f'<g transform="translate(0 0)">{MARK}</g>','0 0 334 256'))
ET.register_namespace('', 'http://www.w3.org/2000/svg')
for file in [OUT/name for name in ['daya-mark.svg','daya-wordmark.svg','daya-logo-horizontal.svg','daya-logo-stacked.svg','logo.svg']]+[ROOT/'public/gestion/assets/logo.svg']:
 subprocess.run(['inkscape',str(file),'--actions=select-all:all;object-stroke-to-path;export-plain-svg;export-filename:'+str(file)+';export-do'],check=True,capture_output=True)
 tree=ET.parse(file)
 for node in tree.iter():
  for key in list(node.attrib):
   if key.startswith('stroke'):del node.attrib[key]
  for key in ['d','transform','style']:
   if key in node.attrib:node.attrib[key]=re.sub(r'-?\d+\.\d{3,}',lambda m:str(round(float(m.group()),2)),node.attrib[key])
 tree.write(file,encoding='unicode')
print('Brand SVG masters prepared with outlined strokes and outlined lettering.')
