/**
 * Inline <head> script, before first paint: on a repeat visit (localStorage "entered" = "1")
 * it marks <html data-gate="skip"> so the server-rendered gate never flashes. `?gate` in the URL
 * forces the gate (for testing). The key is written by EntryGate when the visitor gets in.
 */
const script = `try{var f=/[?&]gate(=|&|$)/.test(location.search);if(!f&&localStorage.getItem("entered")==="1"){document.documentElement.dataset.gate="skip"}}catch(e){}`;

export function GateScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
