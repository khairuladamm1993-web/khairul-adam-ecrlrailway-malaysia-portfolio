/* Fisher–Yates keeps questions and answer identities separate from translations. */
(()=>{
 function shuffle(items,random=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 function assessment(modules,random=Math.random){if(!modules.length||modules.length>2)throw Error('Choose 1 or 2 modules');return shuffle(modules.flatMap(m=>shuffle(m.questions,random).slice(0,16/modules.length).map(q=>({question:q,module:m.id,order:shuffle(q.options.en.map((_,i)=>i),random)}))),random);}
 const api={shuffle,assessment,passed:score=>score>=12};
 if(typeof module!=='undefined')module.exports=api;else window.RailwayQuiz=api;
})();
