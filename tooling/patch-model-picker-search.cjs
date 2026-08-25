const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// Replace the "Model" header label in the chat composer's intelligence dropdown
// with an auto-focusing search input that filters the open model menu.
const titleAnchor =
  't[40]===Symbol.for(`react.memo_cache_sentinel`)?(m=(0,V2.jsx)(zH.Title,{children:(0,V2.jsx)(Z,{id:`composer.intelligenceDropdown.model.title`,defaultMessage:`Model`,description:`Header label above model options in the intelligence dropdown`})}),t[40]=m):m=t[40];';
const titleReplacement =
  't[40]===Symbol.for(`react.memo_cache_sentinel`)?(m=(0,V2.jsx)(CSearchBox,{}),t[40]=m):m=t[40];';

// Component definition, injected at a truly top-level position (brace depth 0).
const compDef = `
function CSearchBox(){
  const [q,setQ]=Wo.useState("");
  const [empty,setEmpty]=Wo.useState(false);
  const ref=Wo.useRef(null);
  const hlIdx=Wo.useRef(-1);

  // Collect the currently-visible model member elements in the open menu.
  const visibleMembers=()=>[...document.querySelectorAll("[data-model-group-member]")].filter(el=>el.style.display!=="none");
  const applyHl=(idx)=>{
    hlIdx.current=idx;
    visibleMembers().forEach((el,i)=>{
      if(i===idx){
        el.setAttribute("data-cx-hl","1");
        el.style.backgroundColor="var(--color-token-list-hover-background, rgba(255,255,255,.08))";
      } else {
        el.setAttribute("data-cx-hl","");
        el.style.backgroundColor="";
      }
    });
  };

  // Highlighting + filtering read from 'q', which is updated by the document
  // keydown interceptor below (the input is read-only/controlled).
  // Focus is unreliable here (Radix steals it), so we SIMULATE focus: the input
  // is styled as always-focused, and ALL keystrokes are captured at document
  // capture — before React/Radix — so typing, Backspace/Delete, arrow keys and
  // Enter all work no matter where the real focus is. We also drive the
  // hover-highlight from a document pointermove capture and stop Radix from
  // focusing items on hover.
  Wo.useEffect(()=>{
    const input=ref.current; if(!input) return;
    input.focus();

    // Highlight the selected model (or the first one) once the list is rendered.
    const initHl=setTimeout(()=>{
      const members=visibleMembers();
      if(!members.length) return;
      const selIdx=members.findIndex(el=>el.getAttribute("data-model-selected")==="true");
      applyHl(selIdx>=0?selIdx:0);
    },0);

    // Highlight the item under the pointer WITHOUT swallowing the event, so
    // Radix's own activation/select still runs (that's what closes the menu).
    const onMove=(e)=>{
      const t=e.target;
      const member=t&&t.closest&&t.closest("[data-model-group-member]");
      if(member&&member.isConnected){
        const members=visibleMembers();
        const idx=members.indexOf(member);
        if(idx>=0){ applyHl(idx); }
      }
    };

    // If Radix focuses a menu item (hover/keyboard), immediately move focus back
    // to the search input so the caret stays put. Synchronous (no setTimeout) so
    // the browser never paints a flashed item-focus state -> no visible blinking.
    const onFocusIn=(ev)=>{
      const t=ev.target;
      if(!t||t===input) return;
      const isItem=!!(t&&t.closest&&(t.closest("[role=menuitem]")||t.closest("[data-model-group-member]")));
      if(isItem&&input.isConnected){ input.focus(); }
    };
    document.addEventListener("focusin",onFocusIn,true);

    // If selecting didn't already close it (Radix may not close on select if the
    // menu is controlled), toggle the trigger closed by sending a real pointer +
    // mouse sequence — Radix toggles on pointerdown, so a bare dot-click won't
    // work. We only fire if the menu is still open to avoid re-opening it.
    const attemptClose=()=>{
      const menu=input.closest("[role=menu]")||document.querySelector("[role=menu]");
      if(!menu||!menu.isConnected) return; // already closed — do nothing
      const trigger=input.closest("[data-codex-intelligence-trigger]")||document.querySelector("[data-codex-intelligence-trigger]");
      if(!trigger||!trigger.isConnected) return;
      const opts={bubbles:true,cancelable:true,view:window};
      try{ trigger.dispatchEvent(new PointerEvent("pointerdown",opts)); }catch(_){}
      trigger.dispatchEvent(new MouseEvent("mousedown",opts));
      try{ trigger.dispatchEvent(new PointerEvent("pointerup",opts)); }catch(_){}
      trigger.dispatchEvent(new MouseEvent("mouseup",opts));
      trigger.dispatchEvent(new MouseEvent("click",opts));
    };
    const onClickAny=(e)=>{
      // Selecting a model keeps the popup open (no close-on-select).
      const member=e.target&&e.target.closest&&e.target.closest("[data-model-group-member]");
      if(member&&member.isConnected){ /* keep open */ }
    };
    document.addEventListener("click",onClickAny,true);

    // Drive the search value + keyboard nav by intercepting keydown at document
    // capture (before React/Radix) and stopping Radix's typeahead/list-nav.
    const onKeyDown=(e)=>{
      const list=visibleMembers();
      const cur=hlIdx.current>=0?Math.min(hlIdx.current,list.length-1):0;
      e.stopImmediatePropagation();
      e.stopPropagation();
      if(e.key==="ArrowDown"){
        if(!list.length) return;
        e.preventDefault();
        applyHl(Math.min(cur+1,list.length-1));
        list[hlIdx.current]&&list[hlIdx.current].scrollIntoView({block:"nearest"});
      } else if(e.key==="ArrowUp"){
        if(!list.length) return;
        e.preventDefault();
        applyHl(Math.max(cur-1,0));
        list[hlIdx.current]&&list[hlIdx.current].scrollIntoView({block:"nearest"});
      } else if(e.key==="Enter"){
        if(!list.length) return;
        e.preventDefault();
        applyHl(cur);
        const item=list[cur]&&(list[cur].closest("[role=menuitem]")||list[cur]);
        if(item){ item.click(); }
      } else if(e.key==="Backspace"||e.key==="Delete"){
        e.preventDefault();
        setQ(prev=>(prev||"").slice(0,-1));
      } else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
        e.preventDefault();
        setQ(prev=>(prev||"")+e.key);
      }
    };

    document.addEventListener("keydown",onKeyDown,true);
    ["pointermove","mousemove"].forEach(name=>document.addEventListener(name,onMove,true));
    return ()=>{ clearTimeout(initHl); document.removeEventListener("focusin",onFocusIn,true); document.removeEventListener("click",onClickAny,true); document.removeEventListener("keydown",onKeyDown,true); ["pointermove","mousemove"].forEach(name=>document.removeEventListener(name,onMove,true)); };
  },[]);

  // Filter on query, hide empty groups, then highlight the first visible model.
  Wo.useEffect(()=>{
    const t=setTimeout(()=>{
      document.querySelectorAll("[data-model-group-member]").forEach(el=>{
        const txt=(el.textContent||"").toLowerCase();
        el.style.display=(!q||txt.indexOf(q.toLowerCase())>=0)?"":"none";
      });
      document.querySelectorAll("[data-model-group-header]").forEach(hdr=>{
        let next=hdr.nextElementSibling, visible=false;
        while(next){
          if(next.hasAttribute&&next.hasAttribute("data-model-group-header")) break;
          if(next.style.display!=="none"){ visible=true; break; }
          next=next.nextElementSibling;
        }
        hdr.style.display=visible?"":"none";
      });
      const members=visibleMembers();
      setEmpty(q?members.length===0:false);
      // While searching, highlight the first match; otherwise keep the selected.
      if(q&&members.length){ applyHl(0); }
    },120);
    return ()=>clearTimeout(t);
  },[q]);

  return (0,V2.jsx)("div",{className:"px-1 py-1",
    children:[
      // Not read-only: the caret/cursor must be visible, and pointer-down
      // re-focuses so the caret reappears even if Radix stole focus.
      (0,V2.jsx)("input",{ref,type:"text",value:q,placeholder:"Search models",spellCheck:false,
        onPointerDown:e=>{e.preventDefault();e.stopPropagation(); if(ref.current){ref.current.focus();} },
        onFocus:()=>{},
        "data-cx-model-search":"",autoComplete:"off",
        className:"w-full rounded-lg border border-token-focus-border bg-token-input-background px-2 py-1 text-sm text-token-input-foreground outline-none placeholder:text-token-input-placeholder-foreground"}),
      (0,V2.jsx)("div",{"data-cx-model-empty":"",style:{display:empty?"":"none"},
        className:"px-2 py-2 text-sm text-token-text-secondary",
        children:"No models found"})
    ]});
}
`;

const topAnchor = "function h(e){setTi";

if (!c.includes(titleAnchor)) throw new Error("model Title anchor not found");
let patched = c;
const iTop = patched.indexOf(topAnchor);
if (iTop < 0) throw new Error("module-top anchor not found");
patched = patched.slice(0, iTop) + "\n" + compDef + patched.slice(iTop);
patched = patched.split(titleAnchor).join(titleReplacement);

fs.writeFileSync(f + ".modsearch", c);
fs.writeFileSync(f, patched);
console.log("renderer model-picker search: OK");
console.log("new length", patched.length, "was", c.length);
