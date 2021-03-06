/* 
 * Copyright (c) 2016, Pierre-Anthony Lemieux <pal@sandflow.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @module imscHTML
 */

;
(function (imscHTML, imscNames, imscStyles) {

    /**
     * Function that maps <pre>smpte:background</pre> URIs to URLs resolving to image resource
     * @callback IMGResolver
     * @param {string} <pre>smpte:background</pre> URI
     * @return {string} PNG resource URL
     */


    /**
     * Renders an ISD object (returned by <pre>generateISD()</pre>) into a 
     * parent element, that must be attached to the DOM. The ISD will be rendered
     * into a child <pre>div</pre>
     * with heigh and width equal to the clientHeight and clientWidth of the element,
     * unless explicitly specified otherwise by the caller. Images URIs specified 
     * by <pre>smpte:background</pre> attributes are mapped to image resource URLs
     * by an <pre>imgResolver</pre> function. The latter takes the value of <code>smpte:background</code>
     * attribute and an <code>img</code> DOM element as input, and is expected to
     * set the <code>src</code> attribute of the <code>img</code> to the absolute URI of the image.
     * <pre>displayForcedOnlyMode</pre> sets the (boolean)
     * value of the IMSC1 displayForcedOnlyMode parameter. The function returns
     * an opaque object that should passed in <code>previousISDState</code> when this function
     * is called for the next ISD, otherwise <code>previousISDState</code> should be set to 
     * <code>null</code>.
     * 
     * @param {Object} isd ISD to be rendered
     * @param {Object} element Element into which the ISD is rendered
     * @param {?IMGResolver} imgResolver Resolve <pre>smpte:background</pre> URIs into URLs.
     * @param {?number} eheight Height (in pixel) of the child <div>div</div> or null 
     *                  to use clientHeight of the parent element
     * @param {?number} ewidth Width (in pixel) of the child <div>div</div> or null
     *                  to use clientWidth of the parent element
     * @param {?boolean} displayForcedOnlyMode Value of the IMSC1 displayForcedOnlyMode parameter,
     *                   or false if null         
     * @param {?module:imscUtils.ErrorHandler} errorHandler Error callback
     * @param {Object} previousISDState State saved during processing of the previous ISD, or null if initial call
     * @param {?boolean} enableRollUp Enables roll-up animations (see CEA 708)
     * @return {Object} ISD state to be provided when this funtion is called for the next ISD
     */

    imscHTML.render = function (isd,
        element,
        imgResolver,
        eheight,
        ewidth,
        displayForcedOnlyMode,
        errorHandler,
        previousISDState,
        enableRollUp
        ) {

        /* maintain aspect ratio if specified */

        var height = eheight || element.clientHeight;
        var width = ewidth || element.clientWidth;

        if (isd.aspectRatio !== null) {

            var twidth = height * isd.aspectRatio;

            if (twidth > width) {

                height = Math.round(width / isd.aspectRatio);

            } else {

                width = twidth;

            }

        }

        var rootcontainer = document.createElement("div");

        rootcontainer.style.position = "relative";
        rootcontainer.style.width = width + "px";
        rootcontainer.style.height = height + "px";
        rootcontainer.style.margin = "auto";
        rootcontainer.style.top = 0;
        rootcontainer.style.bottom = 0;
        rootcontainer.style.left = 0;
        rootcontainer.style.right = 0;
        rootcontainer.style.zIndex = 0;

        var context = {
            h: height,
            w: width,
            regionH: null,
            regionW: null,
            imgResolver: imgResolver,
            displayForcedOnlyMode: displayForcedOnlyMode || false,
            isd: isd,
            errorHandler: errorHandler,
            previousISDState: previousISDState,
            enableRollUp: enableRollUp || false,
            currentISDState: {},
            flg: null, /* current fillLineGap value if active, null otherwise */
            lp: null, /* current linePadding value if active, null otherwise */
            mra: null, /* current multiRowAlign value if active, null otherwise */
            ipd: null, /* inline progression direction (lr, rl, tb) */
            bpd: null /* block progression direction (lr, rl, tb) */
        };

        element.appendChild(rootcontainer);

        for (var i in isd.contents) {

            processElement(context, rootcontainer, isd.contents[i]);

        }

        return context.currentISDState;

    };

    function processElement(context, dom_parent, isd_element) {

        var e;

        if (isd_element.kind === 'region') {

            e = document.createElement("div");
            e.style.position = "absolute";

        } else if (isd_element.kind === 'body') {

            e = document.createElement("div");

        } else if (isd_element.kind === 'div') {

            e = document.createElement("div");

        } else if (isd_element.kind === 'p') {

            e = document.createElement("p");

        } else if (isd_element.kind === 'span') {

            e = document.createElement("span");

            //e.textContent = isd_element.text;

        } else if (isd_element.kind === 'br') {

            e = document.createElement("br");

        }

        if (!e) {

            reportError(context.errorHandler, "Error processing ISD element kind: " + isd_element.kind);

            return;

        }

        /* override UA default margin */
        /* TODO: should apply to <p> only */

        e.style.margin = "0";

        /* tranform TTML styles to CSS styles */

        for (var i in STYLING_MAP_DEFS) {

            var sm = STYLING_MAP_DEFS[i];

            var attr = isd_element.styleAttrs[sm.qname];

            if (attr !== undefined && sm.map !== null) {

                sm.map(context, e, isd_element, attr);

            }

        }

        var proc_e = e;

        /* remember writing direction */

        if (isd_element.kind === "region") {

            var wdir = isd_element.styleAttrs[imscStyles.byName.writingMode.qname];

            if (wdir === "lrtb" || wdir === "lr") {

                context.ipd = "lr";
                context.bpd = "tb";

            } else if (wdir === "rltb" || wdir === "rl") {

                context.ipd = "rl";
                context.bpd = "tb";

            } else if (wdir === "tblr") {

                context.ipd = "tb";
                context.bpd = "lr";

            } else if (wdir === "tbrl" || wdir === "tb") {

                context.ipd = "tb";
                context.bpd = "rl";

            }

        }

        /* do we have linePadding ? */

        var lp = isd_element.styleAttrs[imscStyles.byName.linePadding.qname];

        if (lp && lp > 0) {

            /* apply padding to the <p> so that line padding does not cause line wraps */

            var padmeasure = Math.ceil(lp * context.h) + "px";

            if (context.bpd === "tb") {

                proc_e.style.paddingLeft = padmeasure;
                proc_e.style.paddingRight = padmeasure;

            } else {

                proc_e.style.paddingTop = padmeasure;
                proc_e.style.paddingBottom = padmeasure;

            }

            context.lp = lp;
        }

        // do we have multiRowAlign?

        var mra = isd_element.styleAttrs[imscStyles.byName.multiRowAlign.qname];

        if (mra && mra !== "auto") {

            /* create inline block to handle multirowAlign */

            var s = document.createElement("span");

            s.style.display = "inline-block";

            s.style.textAlign = mra;

            e.appendChild(s);

            proc_e = s;

            context.mra = mra;

        }

        /* remember we are filling line gaps */

        if (isd_element.styleAttrs[imscStyles.byName.fillLineGap.qname]) {
            context.flg = true;
        }


        if (isd_element.kind === "span" && isd_element.text) {

            if (context.lp || context.mra || context.flg) {

                // wrap characters in spans to find the line wrap locations

                var cbuf = '';

                for (var j = 0; j < isd_element.text.length; j++) {

                    cbuf += isd_element.text.charAt(j);

                    var cc = isd_element.text.charCodeAt(j);

                    if (cc < 0xD800 || cc > 0xDBFF || j === isd_element.text.length) {

                        /* wrap the character(s) in a span unless it is a high surrogate */

                        var span = document.createElement("span");

                        span.textContent = cbuf;
    
                        e.appendChild(span);

                        cbuf = '';

                    }

                }

            } else {

                e.textContent = isd_element.text;

            }
        }

        dom_parent.appendChild(e);

        /* process the children of the ISD element */

        for (var k in isd_element.contents) {

            processElement(context, proc_e, isd_element.contents[k]);

        }

        /* list of lines */

        var linelist = [];


        /* paragraph processing */
        /* TODO: linePadding only supported for horizontal scripts */

        if ((context.lp || context.mra || context.flg) && isd_element.kind === "p") {

            constructLineList(context, proc_e, linelist, null);

            /* insert line breaks for multirowalign */

            if (context.mra) {

                applyMultiRowAlign(linelist);

                context.mra = null;

            }

            /* add linepadding */

            if (context.lp) {

                applyLinePadding(linelist, context.lp * context.h, context);

                context.lp = null;

            }

            /* fill line gaps linepadding */

            if (context.flg) {

                var par_edges = rect2edges(proc_e.getBoundingClientRect(), context);

                applyFillLineGap(linelist, par_edges.before, par_edges.after, context);

                context.flg = null;

            }

        }


        /* region processing */

        if (isd_element.kind === "region") {

            /* build line list */

            constructLineList(context, proc_e, linelist);

            /* perform roll up if needed */

            if ((context.bpd === "tb") &&
                context.enableRollUp &&
                isd_element.contents.length > 0 &&
                isd_element.styleAttrs[imscStyles.byName.displayAlign.qname] === 'after') {

                /* horrible hack, perhaps default region id should be underscore everywhere? */

                var rid = isd_element.id === '' ? '_' : isd_element.id;

                var rb = new RegionPBuffer(rid, linelist);

                context.currentISDState[rb.id] = rb;

                if (context.previousISDState &&
                    rb.id in context.previousISDState &&
                    context.previousISDState[rb.id].plist.length > 0 &&
                    rb.plist.length > 1 &&
                    rb.plist[rb.plist.length - 2].text ===
                    context.previousISDState[rb.id].plist[context.previousISDState[rb.id].plist.length - 1].text) {

                    var body_elem = e.firstElementChild;
                    
                    var h = rb.plist[rb.plist.length - 1].after - rb.plist[rb.plist.length - 1].before;

                    body_elem.style.bottom = "-" + h + "px";
                    body_elem.style.transition = "transform 0.4s";
                    body_elem.style.position = "relative";
                    body_elem.style.transform = "translateY(-" + h + "px)";

                }

            }

            /* TODO: clean-up the spans ? */

        }
    }

    function applyLinePadding(lineList, lp, context) {

        for (var i in lineList) {

            var l = lineList[i].elements.length;

            var se = lineList[i].elements[lineList[i].start_elem];

            var ee = lineList[i].elements[lineList[i].end_elem];

            var pospadpxlen = Math.ceil(lp) + "px";

            var negpadpxlen = "-" + Math.ceil(lp) + "px";

            if (l !== 0) {

                if (context.ipd === "lr") {

                    se.node.style.borderLeftColor = se.bgcolor || "#00000000";
                    se.node.style.borderLeftStyle = "solid";
                    se.node.style.borderLeftWidth = pospadpxlen;
                    se.node.style.marginLeft = negpadpxlen;

                } else if (context.ipd === "rl") {

                    se.node.style.borderRightColor = se.bgcolor || "#00000000";
                    se.node.style.borderRightStyle = "solid";
                    se.node.style.borderRightWidth = pospadpxlen;
                    se.node.style.marginRight = negpadpxlen;

                } else if (context.ipd === "tb") {

                    se.node.style.borderTopColor = se.bgcolor || "#00000000";
                    se.node.style.borderTopStyle = "solid";
                    se.node.style.borderTopWidth = pospadpxlen;
                    se.node.style.marginTop = negpadpxlen;

                }

                if (context.ipd === "lr") {

                    ee.node.style.borderRightColor = ee.bgcolor  || "#00000000";
                    ee.node.style.borderRightStyle = "solid";
                    ee.node.style.borderRightWidth = pospadpxlen;
                    ee.node.style.marginRight = negpadpxlen;

                } else if (context.ipd === "rl") {

                    ee.node.style.borderLeftColor = ee.bgcolor || "#00000000";
                    ee.node.style.borderLeftStyle = "solid";
                    ee.node.style.borderLeftWidth = pospadpxlen;
                    ee.node.style.marginLeft = negpadpxlen;

                } else if (context.ipd === "tb") {

                    ee.node.style.borderBottomColor = ee.bgcolor || "#00000000";
                    ee.node.style.borderBottomStyle = "solid";
                    ee.node.style.borderBottomWidth = pospadpxlen;
                    ee.node.style.marginBottom = negpadpxlen;

                }

            }

        }

    }

    function applyMultiRowAlign(lineList) {

        /* apply an explicit br to all but the last line */

        for (var i = 0; i < lineList.length - 1; i++) {

            var l = lineList[i].elements.length;

            if (l !== 0 && lineList[i].br === false) {
                var br = document.createElement("br");

                var lastnode = lineList[i].elements[l - 1].node;

                lastnode.parentElement.insertBefore(br, lastnode.nextSibling);
            }

        }

    }

    function applyFillLineGap(lineList, par_before, par_after, context) {

        /* positive for BPD = lr and tb, negative for BPD = rl */
        var s = Math.sign(par_after - par_before);

        for (var i = 0; i <= lineList.length; i++) {

            /* compute frontier between lines */

            var frontier;

            if (i === 0) {

                frontier = par_before;

            } else if (i === lineList.length) {

                frontier = par_after;

            } else {

                frontier = (lineList[i].before + lineList[i - 1].after) / 2;

            }

            /* padding amount */

            var pad;

            /* current element */

            var e;

            /* before line */

            if (i > 0) {

                for (var j = 0; j < lineList[i - 1].elements.length; j++) {

                    if (lineList[i - 1].elements[j].bgcolor === null) continue;

                    e = lineList[i - 1].elements[j];

                    if (s * (e.after - frontier) < 0) {

                        pad = Math.ceil(Math.abs(frontier - e.after)) + "px";

                        e.node.style.backgroundColor = e.bgcolor;

                        if (context.bpd === "lr") {

                            e.node.style.paddingRight = pad;


                        } else if (context.bpd === "rl") {

                            e.node.style.paddingLeft = pad;

                        } else if (context.bpd === "tb") {

                            e.node.style.paddingBottom = pad;

                        }

                    }

                }

            }

            /* after line */

            if (i < lineList.length) {

                for (var k = 0; k < lineList[i].elements.length; k++) {

                    e = lineList[i].elements[k];

                    if (e.bgcolor === null) continue;

                    if (s * (e.before - frontier) > 0) {

                        pad = Math.ceil(Math.abs(e.before - frontier)) + "px";

                        e.node.style.backgroundColor = e.bgcolor;

                        if (context.bpd === "lr") {

                            e.node.style.paddingLeft = pad;


                        } else if (context.bpd === "rl") {

                            e.node.style.paddingRight = pad;


                        } else if (context.bpd === "tb") {

                            e.node.style.paddingTop = pad;

                        }

                    }

                }

            }

        }

    }

    function RegionPBuffer(id, lineList) {

        this.id = id;

        this.plist = lineList;

    }

    function pruneEmptySpans(element) {

        var child = element.firstChild;

        while (child) {

            var nchild = child.nextSibling;

            if (child.nodeType === Node.ELEMENT_NODE &&
                child.localName === 'span') {

                pruneEmptySpans(child);

                if (child.childElementCount === 0 &&
                    child.textContent.length === 0) {

                    element.removeChild(child);

                }
            }

            child = nchild;
        }

    }

    function rect2edges(rect, context) {

        var edges = {before: null, after: null, start: null, end: null};

        if (context.bpd === "tb") {

            edges.before = rect.top;
            edges.after = rect.bottom;

            if (context.ipd === "lr") {

                edges.start = rect.left;
                edges.end = rect.right;

            } else {

                edges.start = rect.right;
                edges.end = rect.left;
            }

        } else if (context.bpd === "lr") {

            edges.before = rect.left;
            edges.after = rect.right;
            edges.start = rect.top;
            edges.end = rect.bottom;

        } else if (context.bpd === "rl") {

            edges.before = rect.right;
            edges.after = rect.left;
            edges.start = rect.top;
            edges.end = rect.bottom;

        }

        return edges;

    }

    function constructLineList(context, element, llist, bgcolor) {

        var curbgcolor = element.style.backgroundColor || bgcolor;

        if (element.childElementCount === 0) {

            if (element.localName === 'span') {

                var r = element.getBoundingClientRect();

                /* skip if span is not displayed */

                if (r.height === 0 || r.width === 0) return;

                var edges = rect2edges(r, context);

                if (llist.length === 0 ||
                    (!isSameLine(edges.before, edges.after, llist[llist.length - 1].before, llist[llist.length - 1].after))
                    ) {

                    llist.push({
                        before: edges.before,
                        after: edges.after,
                        start: edges.start,
                        end: edges.end,
                        start_elem: 0,
                        end_elem: 0,
                        elements: [],
                        text: "",
                        br: false
                    });

                } else {

                    /* positive for BPD = lr and tb, negative for BPD = rl */
                    var bpd_dir = Math.sign(edges.after - edges.before);

                    /* positive for IPD = lr and tb, negative for IPD = rl */
                    var ipd_dir = Math.sign(edges.end - edges.start);

                    /* check if the line height has increased */

                    if (bpd_dir * (edges.before - llist[llist.length - 1].before) < 0) {
                        llist[llist.length - 1].before = edges.before;
                    }

                    if (bpd_dir * (edges.after - llist[llist.length - 1].after) > 0) {
                        llist[llist.length - 1].after = edges.after;
                    }

                    if (ipd_dir * (edges.start - llist[llist.length - 1].start) < 0) {
                        llist[llist.length - 1].start = edges.start;
                        llist[llist.length - 1].start_elem = llist[llist.length - 1].elements.length;
                    }

                    if (ipd_dir * (edges.end - llist[llist.length - 1].end) > 0) {
                        llist[llist.length - 1].end = edges.end;
                        llist[llist.length - 1].end_elem = llist[llist.length - 1].elements.length;
                    }

                }

                llist[llist.length - 1].text += element.textContent;

                llist[llist.length - 1].elements.push(
                    {
                        node: element,
                        bgcolor: curbgcolor,
                        before: edges.before,
                        after: edges.after
                    }
                );

            } else if (element.localName === 'br' && llist.length !== 0) {

                llist[llist.length - 1].br = true;

            }

        } else {

            var child = element.firstChild;

            while (child) {

                if (child.nodeType === Node.ELEMENT_NODE) {

                    constructLineList(context, child, llist, curbgcolor);

                }

                child = child.nextSibling;
            }
        }

    }

    function isSameLine(before1, after1, before2, after2) {

        return ((after1 < after2) && (before1 > before2)) || ((after2 <= after1) && (before2 >= before1));

    }

    function HTMLStylingMapDefintion(qName, mapFunc) {
        this.qname = qName;
        this.map = mapFunc;
    }

    var STYLING_MAP_DEFS = [

        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling backgroundColor",
            function (context, dom_element, isd_element, attr) {

                /* skip if transparent */
                if (attr[3] === 0) return;

                dom_element.style.backgroundColor = "rgba(" +
                    attr[0].toString() + "," +
                    attr[1].toString() + "," +
                    attr[2].toString() + "," +
                    (attr[3] / 255).toString() +
                    ")";
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling color",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.color = "rgba(" +
                    attr[0].toString() + "," +
                    attr[1].toString() + "," +
                    attr[2].toString() + "," +
                    (attr[3] / 255).toString() +
                    ")";
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling direction",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.direction = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling display",
            function (context, dom_element, isd_element, attr) {}
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling displayAlign",
            function (context, dom_element, isd_element, attr) {

                /* see https://css-tricks.com/snippets/css/a-guide-to-flexbox/ */

                /* TODO: is this affected by writing direction? */

                dom_element.style.display = "flex";
                dom_element.style.flexDirection = "column";


                if (attr === "before") {

                    dom_element.style.justifyContent = "flex-start";

                } else if (attr === "center") {

                    dom_element.style.justifyContent = "center";

                } else if (attr === "after") {

                    dom_element.style.justifyContent = "flex-end";
                }

            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling extent",
            function (context, dom_element, isd_element, attr) {
                /* TODO: this is super ugly */

                context.regionH = (attr.h * context.h);
                context.regionW = (attr.w * context.w);

                /* 
                 * CSS height/width are measured against the content rectangle,
                 * whereas TTML height/width include padding
                 */

                var hdelta = 0;
                var wdelta = 0;

                var p = isd_element.styleAttrs["http://www.w3.org/ns/ttml#styling padding"];

                if (!p) {

                    /* error */

                } else {

                    hdelta = (p[0] + p[2]) * context.h;
                    wdelta = (p[1] + p[3]) * context.w;

                }

                dom_element.style.height = (context.regionH - hdelta) + "px";
                dom_element.style.width = (context.regionW - wdelta) + "px";

            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling fontFamily",
            function (context, dom_element, isd_element, attr) {

                var rslt = [];

                /* per IMSC1 */

                for (var i in attr) {

                    if (attr[i] === "monospaceSerif") {

                        rslt.push("Courier New");
                        rslt.push('"Liberation Mono"');
                        rslt.push("Courier");
                        rslt.push("monospace");

                    } else if (attr[i] === "proportionalSansSerif") {

                        rslt.push("Arial");
                        rslt.push("Helvetica");
                        rslt.push('"Liberation Sans"');
                        rslt.push("sans-serif");

                    } else if (attr[i] === "monospace") {

                        rslt.push("monospace");

                    } else if (attr[i] === "sansSerif") {

                        rslt.push("sans-serif");

                    } else if (attr[i] === "serif") {

                        rslt.push("serif");

                    } else if (attr[i] === "monospaceSansSerif") {

                        rslt.push("Consolas");
                        rslt.push("monospace");

                    } else if (attr[i] === "proportionalSerif") {

                        rslt.push("serif");

                    } else {

                        rslt.push(attr[i]);

                    }

                }

                dom_element.style.fontFamily = rslt.join(",");
            }
        ),

        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling fontSize",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.fontSize = (attr * context.h) + "px";
            }
        ),

        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling fontStyle",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.fontStyle = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling fontWeight",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.fontWeight = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling lineHeight",
            function (context, dom_element, isd_element, attr) {
                if (attr === "normal") {

                    dom_element.style.lineHeight = "normal";

                } else {

                    dom_element.style.lineHeight = (attr * context.h) + "px";
                }
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling opacity",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.opacity = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling origin",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.top = (attr.h * context.h) + "px";
                dom_element.style.left = (attr.w * context.w) + "px";
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling overflow",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.overflow = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling padding",
            function (context, dom_element, isd_element, attr) {

                /* attr: top,left,bottom,right*/

                /* style: top right bottom left*/

                var rslt = [];

                rslt[0] = (attr[0] * context.h) + "px";
                rslt[1] = (attr[3] * context.w) + "px";
                rslt[2] = (attr[2] * context.h) + "px";
                rslt[3] = (attr[1] * context.w) + "px";

                dom_element.style.padding = rslt.join(" ");
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling showBackground",
            null
            ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling textAlign",
            function (context, dom_element, isd_element, attr) {

                var ta;
                var dir = isd_element.styleAttrs[imscStyles.byName.direction.qname];

                /* handle UAs that do not understand start or end */

                if (attr === "start") {

                    ta = (dir === "rtl") ? "right" : "left";

                } else if (attr === "end") {

                    ta = (dir === "rtl") ? "left" : "right";

                } else {

                    ta = attr;

                }

                dom_element.style.textAlign = ta;

            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling textDecoration",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.textDecoration = attr.join(" ").replace("lineThrough", "line-through");
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling textOutline",
            function (context, dom_element, isd_element, attr) {

                if (attr === "none") {

                    dom_element.style.textShadow = "";

                } else {

                    dom_element.style.textShadow = "rgba(" +
                        attr.color[0].toString() + "," +
                        attr.color[1].toString() + "," +
                        attr.color[2].toString() + "," +
                        (attr.color[3] / 255).toString() +
                        ")" + " 0px 0px " +
                        (attr.thickness * context.h) + "px";

                }
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling unicodeBidi",
            function (context, dom_element, isd_element, attr) {

                var ub;

                if (attr === 'bidiOverride') {
                    ub = "bidi-override";
                } else {
                    ub = attr;
                }

                dom_element.style.unicodeBidi = ub;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling visibility",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.visibility = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling wrapOption",
            function (context, dom_element, isd_element, attr) {

                if (attr === "wrap") {

                    if (isd_element.space === "preserve") {
                        dom_element.style.whiteSpace = "pre-wrap";
                    } else {
                        dom_element.style.whiteSpace = "normal";
                    }

                } else {

                    if (isd_element.space === "preserve") {

                        dom_element.style.whiteSpace = "pre";

                    } else {
                        dom_element.style.whiteSpace = "noWrap";
                    }

                }

            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling writingMode",
            function (context, dom_element, isd_element, attr) {
                if (attr === "lrtb" || attr === "lr") {

                    dom_element.style.writingMode = "horizontal-tb";

                } else if (attr === "rltb" || attr === "rl") {

                    dom_element.style.writingMode = "horizontal-tb";

                } else if (attr === "tblr") {

                    dom_element.style.writingMode = "vertical-lr";

                } else if (attr === "tbrl" || attr === "tb") {

                    dom_element.style.writingMode = "vertical-rl";

                }
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml#styling zIndex",
            function (context, dom_element, isd_element, attr) {
                dom_element.style.zIndex = attr;
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.smpte-ra.org/schemas/2052-1/2010/smpte-tt backgroundImage",
            function (context, dom_element, isd_element, attr) {

                if (context.imgResolver !== null && attr !== null) {

                    var img = document.createElement("img");

                    var uri = context.imgResolver(attr, img);

                    if (uri)
                        img.src = uri;

                    img.height = context.regionH;
                    img.width = context.regionW;

                    dom_element.appendChild(img);
                }
            }
        ),
        new HTMLStylingMapDefintion(
            "http://www.w3.org/ns/ttml/profile/imsc1#styling forcedDisplay",
            function (context, dom_element, isd_element, attr) {

                if (context.displayForcedOnlyMode && attr === false) {
                    dom_element.style.visibility = "hidden";
                }

            }
        )
    ];

    var STYLMAP_BY_QNAME = {};

    for (var i in STYLING_MAP_DEFS) {

        STYLMAP_BY_QNAME[STYLING_MAP_DEFS[i].qname] = STYLING_MAP_DEFS[i];
    }

    function reportError(errorHandler, msg) {

        if (errorHandler && errorHandler.error && errorHandler.error(msg))
            throw msg;

    }

})(typeof exports === 'undefined' ? this.imscHTML = {} : exports,
    typeof imscNames === 'undefined' ? require("./names") : imscNames,
    typeof imscStyles === 'undefined' ? require("./styles") : imscStyles);