"""Build the local Solar icon set from the upstream Iconify JSON, without a runtime CDN."""
import json,sys,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=json.loads(Path(sys.argv[1]).read_text()) if len(sys.argv)>1 else json.load(urllib.request.urlopen('https://raw.githubusercontent.com/iconify/icon-sets/master/json/solar.json'))
mapping={
 'home':'home-2','shopping-bag':'bag-4','wallet':'wallet','receipt':'bill-list',
 'package':'box','users':'users-group-rounded','settings':'settings',
 'search':'magnifier','filter':'filter','plus':'add-circle','minus':'minus-circle',
 'x':'close','bell':'bell','mail':'letter','eye':'eye','eye-off':'eye-closed',
 'lock':'lock-keyhole','logout':'logout-2','log-out':'logout-2',
 'arrow-up-right':'arrow-right-up','arrow-down':'arrow-down','arrow-left':'arrow-left',
 'chevron-right':'alt-arrow-right','chevron-left':'alt-arrow-left',
 'chart-bar':'chart','download':'download-minimalistic','upload':'upload-minimalistic',
 'dots':'menu-dots','menu':'hamburger-menu','pause':'pause','play':'play',
 'heart':'heart','check':'check-circle','clock':'clock-circle','info':'info-circle',
 'trash':'trash-bin-trash','edit':'pen','refresh':'refresh',
 'layout-dashboard':'widget-2','user-cog':'user-id','clipboard-list':'clipboard-list',
 'check-check':'check-read','sun':'sun','moon':'moon',
 'alert-triangle':'danger-triangle','grid':'widget','list':'list',
 'sparkles':'stars-minimalistic',
}
out=ROOT/'public/assets/icons';out.mkdir(parents=True,exist_ok=True)
for name,solar in mapping.items():
    key=solar+'-linear'
    assert key in source['icons'],key
    body=source['icons'][key]['body']
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">{body}</svg>\n'
    (out/f'{name}.svg').write_text(svg)
    target=ROOT/'public/gestion/assets/icons'/f'{name}.svg'
    if target.exists(): target.write_text(svg)
(out/'LICENSE.txt').write_text('Solar icons — 480 Design. CC BY 4.0.\nhttps://creativecommons.org/licenses/by/4.0/\nhttps://www.figma.com/community/file/1166831539721848736\nSource: https://github.com/iconify/icon-sets/blob/master/json/solar.json\nSVG wrappers and filenames adapted for Daya Clothing.\nSocial brand symbols are maintained separately.\n')
print(f'Prepared {len(mapping)} Solar icons locally.')
