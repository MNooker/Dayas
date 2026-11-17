"""Refinamiento local de exploraciones Figma AI; conserva los originales v1."""
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/identidad/figma-03'
spec=importlib.util.spec_from_file_location('concepts',ROOT/'scripts/logo-concepts.py')
c=importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)

body={
 'a': '<path fill-rule="evenodd" d="M80 80H239C357 80 432 145 432 253C432 363 357 432 239 432H80ZM146 130V382H230C316 382 365 335 365 253C365 174 316 130 230 130H146ZM316 404C335 372 355 341 375 319C384 309 394 312 395 321C396 330 387 339 380 345Z"/><path d="M379 322C383 317 388 319 387 323C386 327 382 331 378 333C375 334 375 330 377 326Z"/>',
 'b': '<path fill-rule="evenodd" d="M66 82H139C214 82 254 143 254 240C254 318 228 373 179 399C204 411 233 401 251 383L278 396C255 425 216 438 176 421C162 415 151 414 139 414H66ZM103 118V378H137C190 378 218 327 218 240C218 160 190 118 137 118H103Z"/><path fill-rule="evenodd" d="M326 82H350L438.96 414H405.96L381.84 324H294.16L270.04 414H237.04ZM302.63 292H373.37L338 160Z"/>',
 'c': '<g transform="translate(-5 0)"><path d="M110 96H248C352 96 412 154 412 250C412 306 393 351 363 379L327 343C348 318 359 286 359 250C359 173 322 130 252 130H220C211.33 130 207 134.33 207 143V369C207 377.67 211.33 382 220 382H248C273 382 295 374 312 359L348 395C323 410 288 416 248 416H110V397L129 394C141 392 147 384 147 370V142C147 128.67 141 120.67 129 118L110 115Z"/></g>',
}
names={'a':'Hilván','b':'Lazo','c':'Pliegue'}
for key,art in body.items():
    (OUT/f'{key}-simbolo-v2.svg').write_text(c.svg(f'Daya · {names[key]} · Concepto refinado',f'<g transform="scale(.5)">{art}</g>'))
    word=c.wordmark('serif')
    if key=='c':
        default=f'<path transform="translate(0 0)" fill-rule="evenodd" d="{c.SERIF["D"]}"/>'
        d=f'<g transform="translate(-47.25 -43.2) scale(.45)">{art}</g>'
        word=word.replace(default,d).replace('translate(132 0)','translate(146 0)').replace('translate(262 0)','translate(276 0)').replace('translate(393 0)','translate(407 0)')
        word=f'<g transform="translate(30 43) scale(1.1)">{word}</g>'
    else:
        word=f'<g transform="translate(38 43) scale(1.1)">{word}</g>'
    # Descriptor de estudio, convertido a curvas con Inkscape después de generar.
    descriptor='<text x="338" y="232" text-anchor="middle" font-family="sans-serif" font-size="28" letter-spacing="12" fill="#151515">CLOTHING</text>'
    (OUT/f'{key}-firma-v2.svg').write_text(c.svg(f'Daya Clothing · {names[key]} · Firma de estudio',word+descriptor,'0 0 676 256'))
