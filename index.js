const babelParser = require('@babel/parser');
const { parse, print } = require('recast');
const acorn = require('acorn');

const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const core = require('@babel/core')
const loaderUtils = require('loader-utils');

// By setting comment /* add-report: false */ after param to disabled report adding
function checkNotReport(paramNode) {
    // no leadingComments
    let comments = paramNode.leadingComments || paramNode.trailingComments;
    if (!comments || !comments.length) {
        return false;
    }

    let comment = comments.find(c => ['CommentBlock', 'CommentLine'].includes(c.type));
    if (!comment) {
        return false;
    }

    let notReport = /add-report\s*:\s*false/.test(comment.value);
    // console.log(comment.value, notReport);

    return notReport;
}

// Simply add report handle to the begining of catch block
function getReportAst(path, param, options) {
    let code = options.reportCode
        || `window.Sentry && window.Sentry.captureException(${param});`;

    if (typeof options.reportCode === 'string') {
        code = options.reportCode;
    }

    if (typeof options.reportCode === 'function') {
        code = options.reportCode(param, path);
    }

    let ast = parse([code], {
        parser: babelParser
    });

    return ast.program.body;
}

module.exports = function (source) {
    let options = loaderUtils.getOptions(this) || {};
    let sourceAst = parse(source, {
        parser: babelParser
    });

    traverse(sourceAst, {
        CatchClause(path) {
            let bodyNode = path.node.body;
            let paramNode = path.node.param;
            if (bodyNode && bodyNode.body) {
                let noReport = checkNotReport(paramNode);
                // console.log({ noReport})
                if (!noReport) {
                    let reportAst = getReportAst(path, paramNode.name, options);
                    // console.log({ reportAst})
                    bodyNode.body.unshift(...reportAst);
                }
            }
        }
    });

    let code = print(sourceAst).code;
    // console.log({code})

    return code;
};
