!function(e){this.webpackChunk=function(n,t){for(var o in t)e[o]=t[o];for(;n.length;)r[n.pop()]=1};var n={},r={0:1},t={};var o={2:function(){return{"./index.js":{__wbindgen_number_new:function(e){return n[1].exports.__wbindgen_number_new(e)},__wbindgen_object_drop_ref:function(e){return n[1].exports.__wbindgen_object_drop_ref(e)},__wbg_call_00ca88af7ddffcb2:function(e,r,t){return n[1].exports.__wbg_call_00ca88af7ddffcb2(e,r,t)},__wbindgen_throw:function(e,r){return n[1].exports.__wbindgen_throw(e,r)}}}}};function a(r){if(n[r])return n[r].exports;var t=n[r]={i:r,l:!1,exports:{}};return e[r].call(t.exports,t,t.exports,a),t.l=!0,t.exports}a.e=function(e){var n=[];return n.push(Promise.resolve().then(function(){r[e]||importScripts(e+".2b2dea17bfe6d9f9c0ce.worker.js")})),({1:[2]}[e]||[]).forEach(function(e){var r=t[e];if(r)n.push(r);else{var i,u=o[e](),c=fetch(a.p+""+{2:"9fe021223b42644abf24"}[e]+".module.wasm");if(u instanceof Promise&&"function"===typeof WebAssembly.compileStreaming)i=Promise.all([WebAssembly.compileStreaming(c),u]).then(function(e){return WebAssembly.instantiate(e[0],e[1])});else if("function"===typeof WebAssembly.instantiateStreaming)i=WebAssembly.instantiateStreaming(c,u);else{i=c.then(function(e){return e.arrayBuffer()}).then(function(e){return WebAssembly.instantiate(e,u)})}n.push(t[e]=i.then(function(n){return a.w[e]=(n.instance||n).exports}))}}),Promise.all(n)},a.m=e,a.c=n,a.d=function(e,n,r){a.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:r})},a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.t=function(e,n){if(1&n&&(e=a(e)),8&n)return e;if(4&n&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(a.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var t in e)a.d(r,t,function(n){return e[n]}.bind(null,t));return r},a.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(n,"a",n),n},a.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},a.p="/rdr2-bj/",a.w={},a(a.s=0)}([function(e,n,r){addEventListener("message",function(e){var n=e.data;"removed_cards"in n?o.then(function(e){var r=e.Deck,o=(e.Card,e.SpecificHandEV),a=r.generate(1),i=!0,u=!1,c=void 0;try{for(var l,f=n.removed_cards[Symbol.iterator]();!(i=(l=f.next()).done);i=!0)card=l.value,a.remove_card(card)}catch(v){u=!0,c=v}finally{try{i||null==f.return||f.return()}finally{if(u)throw c}}a.remove_card(n.dealer_card);var d=r.new(),s=!0,b=!1,_=void 0;try{for(var p,m=n.hand[Symbol.iterator]();!(s=(p=m.next()).done);s=!0)card=p.value,d.add_card(card),a.remove_card(card)}catch(v){b=!0,_=v}finally{try{s||null==m.return||m.return()}finally{if(b)throw _}}t=o.create_js(a,d,n.dealer_card,function(e){postMessage({progress:e})}),console.log(t),postMessage({ev:{hit:t.hit,stand:t.stand,split:t.split,double:t.double}})}):"hit_card"in n&&(t.add_hit_card(n.hit_card),postMessage({ev:{hit:t.hit,stand:t.stand,split:t.split,double:t.double}}))});var t=null,o=r.e(1).then(r.bind(null,1))}]);
//# sourceMappingURL=2b2dea17bfe6d9f9c0ce.worker.js.map