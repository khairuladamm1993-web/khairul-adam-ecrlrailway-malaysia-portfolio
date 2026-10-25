'use strict';
// R2.17.6 Node QA: interpret only the MapLibre filter operators actually
// emitted by the Kajang POI source guard. Fail on any unexpected expression.
function evaluate(expr,properties){
 if(!Array.isArray(expr))return expr;
 const [op,...args]=expr;
 const read=x=>evaluate(x,properties);
 switch(op){
  case 'all':return args.every(read);
  case 'any':return args.some(read);
  case '!':return !read(args[0]);
  case '==':return read(args[0])===read(args[1]);
  case 'get':return properties[args[0]];
  case 'has':return Object.prototype.hasOwnProperty.call(properties,args[0]);
  case 'literal':return args[0];
  case 'to-string':return String(read(args[0]));
  case 'downcase':return read(args[0]).toLowerCase();
  case 'in':return read(args[1]).includes(read(args[0]));
  default:throw new Error('Unsupported MapLibre filter operator: '+op);
 }
}
module.exports=(filter,properties)=>Boolean(evaluate(filter,properties));
