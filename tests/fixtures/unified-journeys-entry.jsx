import {createRoot} from 'react-dom/client';
import {useEffect} from 'react';
import UnifiedJourneys from '../../src/pages/UnifiedJourneys.jsx';
import BlackBoxProvider from '../../src/blackbox/BlackBoxProvider.jsx';
import {useBlackBox} from '../../src/blackbox/useBlackBox.js';
import {setProgressOwner} from '../../src/utils/progressScope.js';
import '../../src/App.css';
import '../../src/styles/design-system.css';

const root=createRoot(document.getElementById('root'));
export function Fixture(){
 const bridge=useBlackBox();
 useEffect(()=>{window.__suiteFixture.bridge=bridge;});
 return <UnifiedJourneys onHome={()=>{}} onLibrary={()=>{}}/>;
}
const render=uid=>{
 setProgressOwner(uid);
 window.__journeySDK.changePrimary(uid);
 root.render(<BlackBoxProvider><Fixture key={uid??'guest'}/></BlackBoxProvider>);
};
window.__suiteFixture={setOwner:render,show:()=>root.render(<BlackBoxProvider><Fixture/></BlackBoxProvider>),hide:()=>root.render(<BlackBoxProvider><p>Fixture view closed</p></BlackBoxProvider>)};
render(null);
