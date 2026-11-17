"""Exploración 02. Geometría propia; no sustituye ningún logo de producción."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/identidad/revision-02'
OUT.mkdir(parents=True, exist_ok=True)

# Letras dibujadas para esta exploración, en una altura de 144 unidades.
# Las A comparten un travesaño bajo; la curva de D tiene sobrepaso óptico.
SERIF = {
 'D': 'M0 0H53C101 0 128 27 128 72S101 144 53 144H0V134H14V10H0ZM34 11V133H51C85 133 102 110 102 72S85 11 51 11Z',
 'A': 'M0 144V134H12L64 -2H75L132 134H145V144H91V134H108L95 102H39L26 134H43V144ZM44 90H90L67 32Z',
 'Y': 'M0 0H52V10H37L76 69L110.06 10H96V0H139V10H125L87 75.82V134H105V144H46V134H64V80L17 10H0Z',
}
SANS = {
 'D': 'M0 0H49C93 0 120 28 120 72S93 144 49 144H0ZM20 18V126H47C80 126 99 106 99 72S80 18 47 18Z',
 'A': 'M0 144 57 0H77L134 144H112L97 105H37L22 144ZM44 87H90L67 27Z',
 'Y': 'M0 0H23.09L63 69.13 102.91 0H126L73 91.8V144H53V91.8Z',
}

def wordmark(style):
    letters = SERIF if style == 'serif' else SANS
    placements = [('D',0),('A',132),('Y',262),('A',393)] if style == 'serif' else [('D',0),('A',134),('Y',269),('A',398)]
    return ''.join(f'<path transform="translate({x} 0)" fill-rule="evenodd" d="{letters[ch]}"/>' for ch,x in placements)

def svg(name, body, box='0 0 256 256'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-labelledby="title"><title id="title">{name}</title><g fill="#151515">{body}</g></svg>\n'

SYMBOLS = {
 'a': '<path d="M44 28H108C165 28 201 56 212 102L177.36 122C176 82 150 58 108 58H76V198H108C150 198 175 177 180 150L214.64 130C213 190 176 228 108 228H44Z"/>',
 'b': '<path fill-rule="evenodd" d="M34 28H111C180 28 220 66 220 128S180 228 111 228H34V214H54V42H34ZM80 44V212H108C160 212 184 180 184 128S160 44 108 44Z"/>',
 # Canal de separación explícito; las iniciales no se superponen.
 # La pierna izquierda de A completa ópticamente la curva abierta de D.
 'c': '<g transform="translate(-3 0)"><path d="M24 34H81C110 34 131 48 143 72L135 96C125 70 108 57 81 57H48V199H81C94 199 105 196 114 192L108 216C99 221 90 222 78 222H24Z"/><path fill-rule="evenodd" d="M168 34H188L238.37 222H214.37L203.65 182H152.35L141.63 222H117.63ZM158.17 160H197.83L178 86Z"/></g>',
}
NAMES = {'a':'Pliegue','b':'Editorial','c':'Enlace'}

def write(iteration):
    for key, body in SYMBOLS.items():
        (OUT / f'{key}-simbolo-{iteration}.svg').write_text(svg(f'Daya · {NAMES[key]} · Concepto', body))
        style = 'sans' if key == 'c' else 'serif'
        # Un solo montaje de exploración, no un kit de variantes final.
        word = wordmark(style)
        if key == 'a':
            # El corte de la D se repite en la firma para formar una sola idea.
            original_d = f'<path transform="translate(0 0)" fill-rule="evenodd" d="{SERIF["D"]}"/>'
            word = word.replace(original_d, f'<g transform="translate(-31.68 -20.16) scale(.72)">{body}</g>')
        # La firma principal se muestra sola. El símbolo es su compañero compacto.
        lockup = f'<g transform="translate(39 48) scale(1.1)">{word}</g>'
        (OUT / f'{key}-firma-{iteration}.svg').write_text(svg(f'Daya Clothing · {NAMES[key]} · Composición de estudio', lockup, '0 0 676 256'))

if __name__ == '__main__':
    write('v2')
