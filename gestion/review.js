/* A scaled viewport keeps the iframe's actual responsive width intact. */
const devices={ipad:[768,1024],landscape:[1024,768],mobile:[390,844],compact:[320,740],desktop:[1440,900]};
const device=document.querySelector('#device'),surface=document.querySelector('#surface'),frame=document.querySelector('#device-frame'),shell=document.querySelector('.device-shell'),stage=document.querySelector('.stage'),status=document.querySelector('#review-status');
function fit(){const width=Number(frame.width),height=Number(frame.height),scale=Math.min(1,Math.max(0.1,(stage.clientWidth-24)/width));shell.style.width=(width*scale)+'px';shell.style.height=(height*scale)+'px';frame.style.transform='scale('+scale+')';}
function update(){const [width,height]=devices[device.value];frame.width=width;frame.height=height;frame.title='Daya · '+surface.selectedOptions[0].textContent+' · '+device.selectedOptions[0].textContent;status.textContent=width+' × '+height+' px · '+surface.selectedOptions[0].textContent;fit();}
device.addEventListener('change',update);
surface.addEventListener('change',()=>{frame.src='/Dayas/gestion/?revision=1#'+surface.value;update();});
if('ResizeObserver'in window)new ResizeObserver(fit).observe(stage);else addEventListener('resize',fit);
update();
