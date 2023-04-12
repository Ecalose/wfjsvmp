var {JSDOM} = require("jsdom");
var {window} = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global["window"] = window;
fs = require("fs");

var OPCODE = {
    PASS: 11, // 这是个无用字节码,不作任何操作
    PUSH_NUM: 12,
    PUSH_STR: 13,
    PUSH_NULL: 14,
    PUSH_UNDEFINED: 15,

    PUSH_WINDOW: 65, // 主要是this可能是构造器,导致这个this不是window了.
    PUSH_VAR: 66, // 将变量池里的变量压入栈
    MOV_VAR: 67,  // 对变量进行赋值
    PUSH_THIS: 68, // push this => 泛指window
    PUSH_CONSTANT: 69, // push 变量池

    GET_OBJ: 51, // window.console , 获取对象下的属性/对象 ; 数组也是对象,同理;
    SET_OBJ: 52, // window.console = xxx ; 数组也是对象,同理;
    APPLY: 53, // 方法调用
    COMPUTE: 54, // 运算,两个参数
    SINGLE_COMPUTE: 55, // 运算,单个参数
    UPDATE: 56, // a++ ++a --a a--

    NEW_ARRAY: 30, //创建一个空的数组
    NEW_OBJECT: 31, //创建一个空对象
    NEW_FUNC: 32, // 创建一个function
    NEW_CONSTRUCT: 33, // new 一个构造体

    UPDATE_STACK: 20,
    DECREMENT_STACK: 21,

    TRY: 40,
    CATCH: 41,
    TRUE: 42,
    FALSE: 43,
    THROW: 44,
    CATCH_OVER: 45,
    DELETE: 46,
    DEBUG: 47,
    FORIN: 48,
    FINALLY: 49,

    RETURN: 88,
    IS_TRUE: 89,
    SKIP_BLOCK: 90,
    GOTO: 91, // 跳转到循环头位置
    BREAK: 92, // break, 正常的思路应该是break出一段代码的.
    CONTINUE: 93, // continue

    '*': 1000,
    '/': 1001,
    '%': 1002,
    '+': 1003,
    '-': 1004,
    '<<': 1005,
    '>>': 1006,
    '>>>': 1007,
    '>': 1008,
    '<': 1009,
    '>=': 1010,
    '<=': 1011,
    '==': 1012,
    '===': 1013,
    '!==': 1014,
    '!=': 1015,
    '&': 1016,
    '^': 1017,
    '|': 1018,
    '=': 1019,
    '*=': 1020,
    '/=': 1021,
    '%=': 1022,
    '&=': 1023,
    '+=': 1024,
    '-=': 1025,
    '<<=': 1026,
    '>>=': 1027,
    '^=': 1028,
    '|=': 1029,
    'in': 1030,
    'instanceof': 1031,
    "**": 1032,
}
var OPCODE1 = {
    '!': 1032,
    '+': 1033,
    '-': 1034,
    '~': 1035,
    'typeof': 1036,
    'void': 1037,
};

(function (constant, opcode) {
    function vm_enter(opcode, index, constant, stack, esp) {
        function vm_opcodeToString(e, s) {
            // s = [];
            // m = 0;
            // // for (m = 0; m < e.length; m++) {
            // //     b[m] = a["apply"](String, [e[m] - 66]);
            // // }
            // e.map(it => {
            //     return s[m++] = from_char_code(this, it - 66);
            // });
            // return m = s.join('');
            return s = [], m = 0, e.map(it => {
                return s[m++] = from_char_code(this, it - 66);
            }), m = s.join('');
        }

        function vm_push(e, s) {
            return vm_stack[vm_stack.$0++] = e;
        }

        function vm_find_constant(a, b) {
            var c;
            if (a === vm_constant && !a.hasOwnProperty(b)) {
                c = a.__proto__;
                while (c != null) {
                    if (c.hasOwnProperty(b)) {
                        a = c;
                        break
                    } else c = c.__proto__;
                }
            }
            return a;
        }

        function vm_push_2(e, s) {
            return vm_stack[vm_stack.$0] = e, vm_stack.$0++;
        }

        function vm_push_3(e, s) {
            return vm_stack[vm_stack.$0] = e;
        }

        function vm_push_fake_3(e, s) {
            return vm_stack[++vm_stack.$0] = e, vm_stack.$0--;
        }

        function vm_push_fake_2(e, s) {
            return s = vm_stack[vm_stack.$0], vm_stack[vm_stack.$0++] = s, vm_stack.$0--;
        }

        function vm_push_fake_1(e, s) {
            return vm_stack[vm_stack.$0 + 1] = e;
        }

        function vm_update_stack(e, s) {
            return vm_stack.$0++, s;
        }

        function vm_decrement_stack(e, s) {
            return vm_stack.$0--, s;
        }

        function vm_slice() {
            // hj = !hj ? hj : void 0;
            // // 字符串长度
            // h = opcode[index++];
            // h = !st ? (st = String, h >> 6) : h;
            // hj = opcode.slice(index, index + h);
            // // result = op_slice(this, index, index + h);
            // index += h;
            // return hj;
            return hj = !hj ? hj : void 0, h = opcode[index++], h = !st ? (st = String, h >> 6) : h , hj = op_slice(null, index, index + h), index += h, hj;
        }

        function vm_stack_splice(s, e) {
            // return vm_stack.splice(s, e);
            return stack_splice(this, s, e);
        }

        function vm_get_value() {
            return vm_stack[--vm_stack.$0];
        }

        function vm_get_value_fake() {
            return vm_stack[vm_stack.$0 - 1];
        }

        // function vm_get_opcode() {
        //     return opcode[index++];
        // }

        function vm_try_catch(track) {
            d = track[0] , y = track[1];
            /* 这里多了2 try + slice 导致的index+2 */
            switch (d) {
                case OPCODE.BREAK:
                    index += y;
                    if (index > op_len) {
                        // console.log("try break 超出当前opcode字节码数组长度~ return 上一层");
                        return [OPCODE.BREAK, y];
                    }
                    break
                case OPCODE.CONTINUE:
                    index -= y;
                    if (index < 0 || index > op_len) {
                        // console.log("try continue 超出当前opcode字节码数组长度~ return 上一层");
                        return [OPCODE.CONTINUE, y];
                    }
                    break
                case 0:
                    return h;
                default:
                    (function () {
                        debugger;
                    })();
                    console.log("try catch 非BREAK CONTINUE RETURN 指令返回 => return ", h);
            }
        }

        function vmExpression_single_calc(symbol, opNum1) {
            switch (symbol) {
                case "!":
                    return !opNum1
                case "+":
                    return +opNum1
                case "-":
                    return -opNum1
                case "~":
                    return ~opNum1
                case "typeof":
                    return typeof opNum1;
                case "void":
                    return void opNum1;
                default:
                    // debugger;
                    // console.log("vmExpression_single_calc 没有这个 symbol =>", symbol);
                    return undefined
            }
        }

        function vmExpression_calc(symbol, opNum2, opNum1) {
            switch (symbol) {
                case "*":
                    return opNum1 * opNum2
                case "/":
                    return opNum1 / opNum2
                case "%":
                    return opNum1 % opNum2
                case "+":
                    return opNum1 + opNum2
                case "-":
                    return opNum1 - opNum2
                case "**":
                    return opNum1 ** opNum2
                case "<<":
                    return opNum1 << opNum2
                case ">>":
                    return opNum1 >> opNum2
                case ">>>":
                    return opNum1 >>> opNum2
                case ">":
                    return opNum1 > opNum2
                case "<":
                    return opNum1 < opNum2
                case ">=":
                    return opNum1 >= opNum2
                case "<=":
                    return opNum1 <= opNum2
                case "==":
                    return opNum1 == opNum2
                case "===":
                    return opNum1 === opNum2
                case "!==":
                    return opNum1 !== opNum2
                case "!=":
                    return opNum1 != opNum2
                case "&":
                    return opNum1 & opNum2
                case "^":
                    return opNum1 ^ opNum2
                case "|":
                    return opNum1 | opNum2
                case "&&":
                    return opNum1 && opNum2
                case "||":
                    return opNum1 || opNum2
                case "=":
                    return opNum1 = opNum2
                case "*=":
                    return opNum1 *= opNum2
                case "/=":
                    return opNum1 /= opNum2
                case "%=":
                    return opNum1 %= opNum2
                case "&=":
                    return opNum1 &= opNum2
                case "+=":
                    return opNum1 += opNum2
                case "-=":
                    return opNum1 -= opNum2
                case "<<=":
                    return opNum1 <<= opNum2
                case ">>=":
                    return opNum1 >>= opNum2
                case "^=":
                    return opNum1 ^= opNum2
                case "|=":
                    return opNum1 |= opNum2
                case "in":
                    return opNum1 in opNum2
                case "instanceof":
                    return opNum1 instanceof opNum2
                default:
                    // console.log("vmExpression_calc 没有这个 symbol =>", symbol)
                    return undefined
            }
        }

        function vm_call(s, p, z, args, constant) {
            // if (!z.$4) z.$4 = {};
            // var jk = z.$4;

            // 通过args把需要的参数放到当前常量池中去,然后开始调用

            // for (i = 0; i < p.length; i++) {
            //     jk[p[i]] = args[i];
            // }
            // jk["arguments"] = args;

            return hj = 0, jk = {}, jk.__proto__ = constant,
                jk.$5 = args,
                p = p.map(it => jk[it] = args[hj++]), h = vm_enter.apply(this, [s, 0, jk, [], 0]),
                Ar.isArray(h) ? (h = h[1], h) : void 0;
        }

        var vm_stack, h, y, d, g, m, cz, zc, st = String, Ar = Array, Wi = window,
            pthis = this, symbol1, symbol2, Nu, Tr = toString,
            hj, jk, lk, ik, from_char_code = st["fromCharCode"], op_len,
            vm_constant = constant, stack_splice, op_slice;
        vm_stack = !stack ? [] : stack, vm_stack.$0 = esp, cz = [], op_len = opcode.length, zc = cz.splice, jk = cz.slice, Nu = "number", symbol2 = "--", symbol1 = "++", from_char_code = from_char_code.bind(st).call.bind(from_char_code.bind(st)), stack_splice = zc.bind(vm_stack).call.bind(zc.bind(vm_stack)), op_slice = jk.bind(opcode).call.bind(jk.bind(opcode));


        // let get_key = (object, value) => {
        //     return Object.keys(object).find(key => object[key] === value)
        // };

        for (; ;) {
            g = opcode[index++];

            if (Number.isNaN(g) || !g) {
                break
            }
            switch (g) {
                case OPCODE.PASS:
                    vm_push_fake_1(void 0);
                    break
                case OPCODE.PUSH_WINDOW:
                    vm_push(Wi);
                    break
                case OPCODE.PUSH_STR:
                    st = undefined;
                    h = vm_opcodeToString.apply(undefined, [vm_slice()]);
                    vm_push(h);
                    // if (is_console) {
                    //     console.log("push 字符串 => ", h);
                    // }
                    break
                case OPCODE.PUSH_NUM:
                    h = opcode[index++];
                    vm_push(h);
                    break
                case OPCODE.PUSH_NULL:
                    vm_push(null);
                    break
                case OPCODE.PUSH_UNDEFINED:
                    vm_push(void 0);
                    break
                case OPCODE.PUSH_CONSTANT:
                    vm_push(vm_constant);
                    break
                case OPCODE.PUSH_THIS:
                    vm_push(pthis);
                    break
                case OPCODE.PUSH_VAR:
                    d = vm_get_value();
                    y = vm_get_value();
                    // if (d === undefined || y === undefined || d[y] === undefined) {
                    //     vm_push(undefined);
                    //     // console.log(" 对象 => ", !!d && d.toString(), " key => ", y)
                    //     break;
                    // } else d = vm_find_constant(d, y);
                    // vm_push(d[y]);

                    // d是undefined是有问题的应该
                    d === undefined || y === undefined || d[y] === undefined ? vm_push(undefined) : (d = vm_find_constant(d, y) , vm_push(d[y]));
                    break
                case OPCODE.MOV_VAR:
                    /* value */
                    y = vm_get_value();
                    /* 对象 */
                    d = vm_get_value();
                    /* key */
                    h = vm_get_value();

                    d = vm_find_constant(d, h);

                    d[h] = y;

                    vm_push_2(y);
                    break
                case OPCODE.COMPUTE:
                    /* d是第二个 */
                    d = vm_get_value();
                    /* y是第一个 */
                    y = vm_get_value();
                    /* symbol */
                    h = vm_get_value();

                    m = vmExpression_calc(h, d, y);

                    vm_push(m);
                    break
                case OPCODE.SINGLE_COMPUTE:
                    /* 这里有二个值, 堆栈里的值,一个是标识符 */
                    d = vm_get_value();
                    /* symbol */
                    y = vm_get_value();

                    h = vmExpression_single_calc(y, d);

                    vm_push(h);
                    break
                case OPCODE.UPDATE:
                    /* 这里有二个值, 对象, key 最后是标识符 */

                    /* symbol */
                    y = vm_get_value();
                    /* 对象 */
                    d = vm_get_value();
                    /* key */
                    h = vm_get_value();

                    d = vm_find_constant(d, h);

                    y == symbol1 ? d[h]++ : symbol2 == y && d[h]--;
                    break
                case OPCODE.NEW_ARRAY:
                    /* new 一个 array 后面跟的是初始化的对象个数 */
                    y = opcode[index++];

                    // d = Array();
                    // for (var i = 0; i < y; i++) {
                    //     d[y - i - 1] = vm_get_value();
                    // }

                    d = vm_stack_splice(vm_stack.$0 - y, y);
                    vm_stack.$0 = vm_stack.$0 - y;
                    vm_push(d);
                    break
                case OPCODE.DELETE:
                    d = vm_get_value();
                    h = vm_get_value();
                    // delete h[d];
                    delete d[h];
                    break
                case OPCODE.GET_OBJ:
                    /* 对象, key, 将值压入堆栈 */
                    y = vm_get_value();
                    d = vm_get_value();
                    h = y[d];
                    // h = vm_get_value()[vm_get_value()];
                    vm_push(h);

                    break;
                case OPCODE.SET_OBJ:
                    /* 对象,key,进行赋值 */
                    y = vm_get_value();
                    d = vm_get_value();
                    h = vm_get_value();
                    d[h] = y;
                    vm_push_2(y);
                    /* 这样更具迷惑性 */
                    // vm_get_value()[vm_get_value()] = vm_get_value();
                    break
                case OPCODE.NEW_OBJECT:
                    y = {};
                    d = opcode[index++];
                    // for (ik = 0; ik < d; ik++) {
                    //     m = vm_get_value();
                    //     h = vm_get_value();
                    //     y[h] = m;
                    // }
                    zc = (new Ar(d)).fill(1);
                    cz = zc.map(it => {
                        m = vm_get_value(), h = vm_get_value(), y[h] = m, it
                    });
                    d = vm_stack.$0;
                    vm_stack_splice(vm_stack.$0, vm_stack.length - 1);
                    vm_stack.$0 = d;
                    vm_push(y);
                    break
                case OPCODE.APPLY:
                    /* 调用者 */
                    y = vm_get_value();
                    /* 自定义方法 */
                    h = vm_get_value();
                    /* 传参 */
                    d = vm_get_value();

                    // if (h === undefined) {
                    //     vm_push_fake_2(d);
                    // } else if (h.hasOwnProperty("$0")) {
                    //     /* 这里this还没判断啊~ 很烦 */
                    //     d = h.apply(y, d);
                    //     /* 方法调用管你要不要值,我都直接push到堆栈里呢 */
                    //     vm_push(d);
                    // } else {
                    //     /*  方法  */
                    //     // if (h.name === "toString") {
                    //     //     /* toString(16) */
                    //     //     d = y.toString(d[0]);
                    //     // } else {
                    //     //     d = h.apply(y, d);
                    //     // }
                    //     // vm_push(d);
                    //
                    // }
                    h === void 0 ? vm_push_fake_2(d) : h.hasOwnProperty("$0") ? (d = h.apply(y, d), vm_push(d)) :
                        (h.name === Tr.name ? d = typeof d[0] == Nu ? y.toString(d[0]) : y.toString() : d = h.apply(y, d), vm_push(d));
                    break
                case OPCODE.NEW_FUNC:
                    y = opcode[index++];
                    d = index;
                    index += y;
                    m = (function () {
                        return zzz;

                        function zzz() {
                            var f = arguments;
                            h = vm_call.apply(this, [zzz.$1, zzz.$2, zzz, f, vm_constant]);
                            return h;
                        }
                    }
                    ()), m.$1 = op_slice(null, d, index)
                    m.$2 = vm_stack[--vm_stack.$0],
                        vm_push(m);
                    break
                case OPCODE.IS_TRUE:
                    y = vm_get_value();
                    // if (!!y) {
                    //     index++;
                    // } else {
                    //     d = opcode[index++];
                    //     index += d;
                    // }
                    !!y ? index++ : (d = opcode[index++], index += d);
                    break
                case OPCODE.SKIP_BLOCK:
                    y = opcode[index++];
                    index += y;
                    break
                case OPCODE.GOTO:
                    /* 这里可能会有问题 */
                    index -= opcode[index++];
                    break
                case OPCODE.NEW_CONSTRUCT:
                    /* 传参 */
                    d = vm_get_value();
                    /* 调用者/自定义方法 */
                    y = vm_get_value();
                    h = new y(...d);
                    vm_push(h);
                    break
                case OPCODE.BREAK:
                    y = opcode[index++];
                    index += y;
                    if (index > op_len) {
                        // console.log("break 超出当前opcode字节码数组长度~ return 上一层");
                        return [OPCODE.BREAK, y];
                    }
                    break
                case OPCODE.CONTINUE:
                    y = opcode[index++];
                    index -= y;
                    if (index < 0 || index > op_len) {
                        // console.log("continue 超出当前opcode字节码数组长度~ return 上一层");
                        return [OPCODE.CONTINUE, y];
                    }
                    break
                case OPCODE.TRUE:
                    h = void 0;
                    y = !h;
                    vm_push(y);
                    break
                case OPCODE.FALSE:
                    m = void 0;
                    d = !!m;
                    vm_push(d);
                    break
                case OPCODE.THROW:
                    throw vm_get_value();
                case OPCODE.TRY:
                    try {
                        /* 现在的索引 */
                        d = index;
                        /* try opcode */
                        y = vm_slice();
                        d += y.length + 1;
                        h = vm_enter.apply(this, [y, 0, vm_constant, vm_stack, vm_stack.$0]);
                        if (Ar.isArray(h)) {
                            return vm_try_catch(h);
                        }
                    } catch (e) {
                        index = d + 2;
                        m = vm_slice();
                        /* push e对象 */
                        vm_enter.apply(this, [m, 0, vm_constant, vm_stack, vm_stack.$0]);
                        vm_push(e);
                        m = vm_slice();
                        h = vm_enter.apply(this, [m, 0, vm_constant, vm_stack, vm_stack.$0]);
                        if (Ar.isArray(h)) {
                            return vm_try_catch(h);
                        }
                    } finally {
                        y = opcode[index++];
                        /* 没走到catch */
                        if (y === OPCODE.SKIP_BLOCK) {
                            y = opcode[index++];
                            index += y;
                            y = opcode[index++];
                        }
                        if (y === OPCODE.FINALLY) {
                            m = vm_slice();
                            h = vm_enter.apply(this, [m, 0, vm_constant, vm_stack, vm_stack.$0]);
                            if (Ar.isArray(h)) {
                                return vm_try_catch(h);
                            }
                        } else index--;
                    }
                    break
                case OPCODE.FORIN:
                    d = vm_get_value();
                    lk = vm_get_value();
                    ik = vm_get_value();
                    zc = vm_slice();
                    for (cz in d) {
                        vm_push_2(ik);
                        vm_push(lk);
                        vm_push_2(cz);
                        h = vm_enter.apply(this, [zc, 0, vm_constant, vm_stack, vm_stack.$0]);
                        if (Ar.isArray(h)) {
                            m = h[0] , y = h[1];
                            if (m == OPCODE.BREAK) {
                                break;
                            } else if (m == OPCODE.CONTINUE) {
                                continue;
                            } else if (m == 0) {
                                return h;
                            } else {
                                (function () {
                                    debugger;
                                })();
                                console.log("try 非BREAK CONTINUE RETURN 指令返回 => ", h);
                            }
                            // switch (m) {
                            //     case OPCODE.BREAK:
                            //         break
                            //     case OPCODE.CONTINUE:
                            //         continue;
                            //     case 0:
                            //         return h;
                            //     default:
                            //         (function () {
                            //             debugger;
                            //         })();
                            //         console.log("try 非BREAK CONTINUE RETURN 指令返回 => ", h);
                            //     // return h;
                            // }
                        }
                    }
                    break
                case OPCODE.UPDATE_STACK:
                    /* 把之前的值拿下来 */
                    vm_stack.$0++;
                    break
                case OPCODE.DECREMENT_STACK:
                    vm_stack.$0--;
                    break
                case OPCODE.RETURN:
                    // y = vm_get_value();
                    // return [0, y];
                    return [0, vm_get_value()];
                case OPCODE.DEBUG:
                    debugger;
                    break

                case OPCODE["*"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h * d;
                    vm_push(y);
                    break;

                case OPCODE["/"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h / d;
                    vm_push(y);
                    break;

                case OPCODE["%"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h % d;
                    vm_push(y);
                    break;

                case OPCODE["+"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h + d;
                    vm_push(y);
                    break;

                case OPCODE["-"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h - d;
                    vm_push(y);
                    break;

                case OPCODE["<<"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h << d;
                    vm_push(y);
                    break;

                case OPCODE[">>"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h >> d;
                    vm_push(y);
                    break;

                case OPCODE[">>>"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h >>> d;
                    vm_push(y);
                    break;

                case OPCODE[">"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h > d;
                    vm_push(y);
                    break;

                case OPCODE["<"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h < d;
                    vm_push(y);
                    break;

                case OPCODE[">="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h >= d;
                    vm_push(y);
                    break;

                case OPCODE["<="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h <= d;
                    vm_push(y);
                    break;

                case OPCODE["=="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h == d;
                    vm_push(y);
                    break;

                case OPCODE["==="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h === d;
                    vm_push(y);
                    break;

                case OPCODE["!=="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h !== d;
                    vm_push(y);
                    break;

                case OPCODE["!="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h != d;
                    vm_push(y);
                    break;

                case OPCODE["&"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h & d;
                    vm_push(y);
                    break;

                case OPCODE["^"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h ^ d;
                    vm_push(y);
                    break;

                case OPCODE["|"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h | d;
                    vm_push(y);
                    break;

                case OPCODE["="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h = d;
                    vm_push(h);
                    break;

                case OPCODE["*="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h *= d;
                    vm_push(h);
                    break;

                case OPCODE["/="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h /= d;
                    vm_push(h);
                    break;

                case OPCODE["%="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h %= d;
                    vm_push(h);
                    break;

                case OPCODE["&="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h &= d;
                    vm_push(h);
                    break;

                case OPCODE["+="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h += d;
                    vm_push(h);
                    break;

                case OPCODE["-="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h -= d;
                    vm_push(h);
                    break;

                case OPCODE["<<="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h <<= d;
                    vm_push(h);
                    break;

                case OPCODE[">>="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h >>= d;
                    vm_push(h);
                    break;

                case OPCODE["^="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h ^= d;
                    vm_push(h);
                    break;

                case OPCODE["|="]:
                    d = vm_get_value();
                    h = vm_get_value();
                    h |= d;
                    vm_push(h);
                    break;

                case OPCODE["in"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h in d;
                    vm_push(y);
                    break;

                case OPCODE["instanceof"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h instanceof d;
                    vm_push(y);
                    break;

                case OPCODE["**"]:
                    d = vm_get_value();
                    h = vm_get_value();
                    y = h ** d;
                    vm_push(y);
                    break;

                case OPCODE1["!"]:
                    d = vm_get_value();
                    h = vm_get_value_fake();
                    y = !d;
                    vm_push(y);
                    break;

                case OPCODE1["+"]:
                    d = vm_get_value();
                    h = vm_get_value_fake();
                    y = +d
                    vm_push(y);
                    break;

                case OPCODE1["-"]:
                    d = vm_get_value();
                    h = vm_get_value_fake();
                    y = -d;
                    vm_push(y);
                    break;

                case OPCODE1["~"]:
                    d = vm_get_value();
                    h = vm_get_value_fake();
                    y = ~d
                    vm_push(y);
                    break;

                case OPCODE1["typeof"]:
                    d = vm_get_value();
                    h = vm_get_value_fake();
                    y = typeof d;
                    vm_push(y);
                    break;

                case OPCODE1["void"]:
                    d = vm_get_value();
                    h = vm_get_value_fake();
                    y = void d;
                    vm_push(y);
                    break;

                default:
                    console.log("index => ", index, "opcode => err => ", g);
                    debugger;
            }
        }
    }

    /* collect 存放for循环test 后 IS_TRUE的索引 */
    vm_enter.apply(constant.window = this, [opcode, 0, constant, void 0, 0]);
})(constant = {"$_jsvmp": true}, fs.readFileSync("./opcode.txt") + '');


