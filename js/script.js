var orgChart = (function () {
    var scriptVersion = "1.0.2";
    var util = {
        version: "1.0.1",
        cutString: function (text, textLength) {
            try {
                if (textLength < 0) return text;
                else {
                    return (text.length > textLength) ?
                        text.substring(0, textLength - 3) + "..." :
                        text
                }
            } catch (e) {
                return text;
            }
        },
        convertJSON2LowerCase: function (obj) {
            try {
                var output = {};
                for (i in obj) {
                    if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
                        output[i.toLowerCase()] = util.convertJSON2LowerCase(obj[i]);
                    } else if (Object.prototype.toString.apply(obj[i]) === '[object Array]') {
                        output[i.toLowerCase()] = [];
                        output[i.toLowerCase()].push(util.convertJSON2LowerCase(obj[i][0]));
                    } else {
                        output[i.toLowerCase()] = obj[i];
                    }
                }

                return output;
            } catch (e) {
                return;
                console.error("error while to lower json");
                console.error(e);
            }
        },
        link: function (link) {
            return window.location = link;
        },
        escapeHTML: function (str) {
            if (str === null) {
                return null;
            }
            if (typeof str === "undefined") {
                return;
            }
            if (typeof str === "object") {
                try {
                    str = JSON.stringify(str);
                } catch (e) {
                    /*do nothing */
                }
            }
            try {
                return apex.util.escapeHTML(String(str));
            } catch (e) {
                str = String(str);
                return str
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#x27;")
                    .replace(/\//g, "&#x2F;");
            }
        },
        loader: {
            start: function (id) {

                try {
                    apex.util.showSpinner($(id));
                } catch (e) {
                    /* define loader */
                    var faLoader = $("<span></span>");
                    faLoader.attr("id", "loader" + id);
                    faLoader.addClass("ct-loader fa-stack fa-3x");

                    /* define circle for loader */
                    var faCircle = $("<i></i>");
                    faCircle.addClass("fa fa-circle fa-stack-2x");
                    faCircle.css("color", "rgba(121,121,121,0.6)");

                    /* define refresh icon with animation */
                    var faRefresh = $("<i></i>");
                    faRefresh.addClass("fa fa-refresh fa-spin fa-inverse fa-stack-1x");
                    faRefresh.css("animation-duration", "1.8s");

                    /* append loader */
                    faLoader.append(faCircle);
                    faLoader.append(faRefresh);
                    $(id).append(faLoader);
                }
            },
            stop: function (id) {
                $(id + " > .u-Processing").remove();
                $(id + " > .ct-loader").remove();
            }
        },
        tooltip: {
            show: function (htmlContent, backgroundColor, maxWidth) {
                try {
                    if ($("#dynToolTip").length == 0) {
                        var tooltip = $("<div></div>")
                            .attr("id", "dynToolTip")
                            .css("max-width", "400px")
                            .css("position", "absolute")
                            .css("top", "0px")
                            .css("left", "0px")
                            .css("z-index", "2000")
                            .css("background-color", "rgba(240, 240, 240, 1)")
                            .css("padding", "10px")
                            .css("display", "block")
                            .css("top", "0")
                            .css("overflow-wrap", "break-word")
                            .css("word-wrap", "break-word")
                            .css("-ms-hyphens", "auto")
                            .css("-moz-hyphens", "auto")
                            .css("-webkit-hyphens", "auto")
                            .css("hyphens", "auto");
                        if (backgroundColor) {
                            tooltip.css("background-color", backgroundColor);
                        }
                        if (maxWidth) {
                            tooltip.css("max-width", maxWidth);
                        }
                        $("body").append(tooltip);
                    } else {
                        $("#dynToolTip").css("visibility", "visible");
                    }
                    $("#dynToolTip").html(htmlContent);
                } catch (e) {
                    console.error('Error while try to show tooltip');
                    console.error(e);
                }
            },
            setPosition: function (event) {
                $("#dynToolTip").position({
                    my: "left+6 top+6",
                    of: event,
                    collision: "flipfit"
                });
            },
            hide: function () {
                $("#dynToolTip").css("visibility", "hidden");
            },
            remove: function () {
                $("#dynToolTip").remove();
            }
        },
        jsonSaveExtend: function (srcConfig, targetConfig) {
            var finalConfig = {};
            /* try to parse config json when string or just set */
            if (typeof targetConfig === 'string') {
                try {
                    targetConfig = JSON.parse(targetConfig);
                } catch (e) {
                    console.error("Error while try to parse udConfigJSON. Please check your Config JSON. Standard Config will be used.");
                    console.error(e);
                    console.error(targetConfig);
                }
            } else {
                finalConfig = targetConfig;
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, srcConfig, targetConfig);
            } catch (e) {
                console.error('Error while try to merge udConfigJSON into Standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.');
                console.error(e);
                finalConfig = srcConfig;
                console.error(finalConfig);
            }
            return finalConfig;
        },
        noDataMessage: {
            show: function (id, text) {
                var div = $("<div></div>")
                    .css("margin", "12px")
                    .css("text-align", "center")
                    .css("padding", "64px 0")
                    .addClass("nodatafoundmessage");

                var subDiv = $("<div></div>");

                var subDivSpan = $("<span></span>")
                    .addClass("fa")
                    .addClass("fa-search")
                    .addClass("fa-2x")
                    .css("height", "32px")
                    .css("width", "32px")
                    .css("color", "#D0D0D0")
                    .css("margin-bottom", "16px");

                subDiv.append(subDivSpan);

                var span = $("<span></span>")
                    .text(text)
                    .css("display", "block")
                    .css("color", "#707070")
                    .css("font-size", "12px");

                div
                    .append(subDiv)
                    .append(span);

                $(id).append(div);
            },
            hide: function (id) {
                $(id).children('.nodatafoundmessage').remove();
            }
        }
    };

    return {
        initTree: function (regionID, ajaxID, noDataMessage, udConfigJSON, items2Submit, escapeHTML) {
            var stdConfigJSON = {
                    "modus": "diagonal",
                    "refresh": 0,
                    "minHeight": "450px",
                    "transitionDuration": 750,
                    "rectangleWidth": 150,
                    "rectangleHeight": 60,
                    "rectangleSpacing": 10,
                    "rectangleColor": "rgba(41, 128, 185, 1)",
                    "rectangleLeafColor": "rgba(121, 121, 121, 1)",
                    "cutTextAfter": 30,
                    "textColor": "white"
                },
                configJSON = {};
            //extend configJSON with iven attributes
            configJSON = util.jsonSaveExtend(stdConfigJSON, udConfigJSON);
            configJSON.regionID = regionID;
            configJSON.ajaxID = ajaxID;
            configJSON.noDataMessage = noDataMessage;
            configJSON.items2Submit = items2Submit;

            if (escapeHTML !== false) {
                configJSON.escapeHTML = true;
            }

            // for rounded lines
            if (configJSON.modus == "line") {
                configJSON.fixedDepth = 80;
            } else {
                configJSON.fixedDepth = 110;
            }

            // set min height for region
            $(configJSON.regionID).css("min-height", configJSON.minHeight);

            var width, height, u_childwidth,
                _root = {},
                _nodes = [],
                _counter = 0,
                _svgroot = null,
                _svg = null,
                _tree = null,
                _diagonal = null,
                _lineFunction = null,
                _loadFunction = function () {},
                _callerNode = null,
                _callerMode = 0,
                defBoxShadow = function (id) {
                    var filter = _svgroot.append("svg:defs")
                        .append("svg:filter")
                        .attr("id", id).attr("height", "150%").attr("width", "150%");

                    filter.append("svg:feOffset")
                        .attr("dx", "2").attr("dy", "2").attr("result", "offOut"); // how much to offset
                    filter.append("svg:feGaussianBlur")
                        .attr("in", "offOut").attr("result", "blurOut").attr("stdDeviation", "2"); // stdDeviation is how much to blur
                    filter.append("svg:feBlend")
                        .attr("in", "SourceGraphic").attr("in2", "blurOut").attr("mode", "normal");
                },
                collapse = function (d) {
                    if (d.children) {
                        d.childCount = d.children.length;
                        d._children = d.children;
                        d._children.forEach(collapse);
                        d.children = null;
                    }
                },
                update = function (source) {
                    // Compute the new tree layout.
                    _nodes = _tree.nodes(_root).reverse();
                    var links = _tree.links(_nodes);
                    // Normalize for fixed-depth.
                    _nodes.forEach(function (d) {
                        d.y = d.depth * configJSON.fixedDepth;
                    });
                    // Update the nodes
                    var node = _svg.selectAll("g.node")
                        .data(_nodes, function (d) {
                            if (d.children) {
                                d.childCount = 1;
                            }
                            return d.id || (d.id = ++_counter);
                        });
                    // Enter any new nodes at the parent's previous position.
                    var nodeEnter = node.enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function (d) {
                            return "translate(" + source.x0 + "," + source.y0 + ")";
                        })
                        .on("click", nodeclick);
                    nodeEnter.append("rect")
                        .attr("width", configJSON.rectangleWidth)
                        .attr("height", configJSON.rectangleHeight)
                        .attr("fill", "#898989")
                        .attr("filter", "url(#boxShadow)");

                    nodeEnter.append("rect")
                        .attr("width", configJSON.rectangleWidth)
                        .attr("height", configJSON.rectangleHeight)
                        .attr("id", function (d) {
                            return d.id;
                        })
                        .attr("fill", function (d) {
                            return d.color ? d.color : ((d.childCount > 0) ? configJSON.rectangleColor : configJSON.rectangleLeafColor);
                        })
                        .style("cursor", function (d) {
                            return (d.childCount > 0) ? "pointer" : "default";
                        })
                        .attr("class", "box")
                        .on("click", function (d) {
                            if (d.link && d.link.length > 0 && d.childCount == 0) {
                                util.link(d.link);
                            }
                            if (d.details) {
                                $('#detailsmodal').modal('show');
                                fillModalTable(d);
                            }
                        })
                        .on("mousemove", function (d) {
                            if (d.tooltip && d.tooltip.length > 0) {
                                var tooltip = d.tooltip;
                                if (configJSON.escapeHTML) {
                                    tooltip = util.escapeHTML(tooltip);
                                }
                                util.tooltip.show(tooltip);
                            }
                            util.tooltip.setPosition(d3.event);
                        })
                        .on("mouseout", function () {
                            util.tooltip.hide();
                        });

                    nodeEnter.append("text")
                        .attr("x", configJSON.rectangleWidth / 2)
                        .attr("y", configJSON.rectangleHeight / 2)
                        .attr("dy", ".35em")
                        .attr("class", "org-chart-label-text")
                        .attr("text-anchor", "middle")
                        .attr("fill", configJSON.textColor)
                        .style("cursor", function (d) {
                            return (d.childCount > 0) ? "pointer" : "default";
                        })
                        .text(function (d) {
                            return util.cutString(d.name, configJSON.cutTextAfter);
                        })
                        .on("click", function (d) {
                            if (d.link && d.link.length > 0 && d.childCount == 0) {
                                util.link(d.link);
                            }
                            if (d.details) {
                                $('#detailsmodal').modal('show');
                                fillModalTable(d);
                            }
                        })
                        .on("mousemove", function (d) {
                            if (d.tooltip && d.tooltip.length > 0) {
                                var tooltip = d.tooltip;
                                if (configJSON.escapeHTML) {
                                    tooltip = util.escapeHTML(tooltip);
                                }
                                util.tooltip.show(tooltip);
                            }
                            util.tooltip.setPosition(d3.event);
                        })
                        .on("mouseout", function () {
                            util.tooltip.hide();
                        });

                    function fillModalTable(d) {
                        if (d.details.title) {
                            $("#modal-title").text(d.details.title);
                        } else {
                            $("#modal-table-title").html("-");
                        }
                        if (d.name) {
                            $("#modal-table-method").html(d.name);
                        } else {
                            $("#modal-table-method").html("-");
                        }
                        if (d.details.description) {
                            $("#modal-table-description").html(d.details.description);
                        } else {
                            $("#modal-table-description").html("-");
                        }
                        if (d.details.path) {
                            $("#modal-table-path").html(d.details.path.replace(/\{/g, '<span class="path-variables">{').replace(/\}/g, '}</span>'));
                        } else {
                            $("#modal-table-path").html("-");
                        }
                        if (d.details.uri_params) {
                            $("#modal-table-uri-params").html(d.details.uri_params.replace(/\{/g, '<span class="path-variables">{').replace(/\}/g, '}</span>'));
                        } else {
                            $("#modal-table-uri-params").html("-");
                        }
                        if (d.details.headers) {
                            $("#modal-table-headers").html(d.details.headers.replace(/\{/g, '<span class="path-variables">{').replace(/\}/g, '}</span>'));
                        } else {
                            $("#modal-table-headers").html("-");
                        }
                        if (d.details.example) {
                            $("#modal-table-example").html(d.details.example);
                        } else {
                            $("#modal-table-example").html("-");
                        }
                    }
                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                        .duration(configJSON.transitionDuration)
                        .attr("transform", function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    nodeUpdate.select("rect.box")
                        .attr("fill", function (d) {
                            return d.color ? d.color : ((d.childCount > 0) ? configJSON.rectangleColor : configJSON.rectangleLeafColor);
                        });

                    // Transition exiting nodes to the parent's new position.
                    var nodeExit = node.exit().transition()
                        .duration(configJSON.transitionDuration)
                        .attr("transform", function (d) {
                            return "translate(" + source.x + "," + source.y + ")";
                        })
                        .remove();

                    // Update the links
                    var link = _svg.selectAll("path.link")
                        .data(links, function (d) {
                            return d.target.id;
                        });

                    if (configJSON.modus === "line") {
                        // Enter any new links at the parent's previous position.
                        link.enter().append("path", "g")
                            .attr("class", "link")
                            .attr("d", function (d) {
                                var u_line = (function (d) {
                                    var u_linedata = [{
                                            "x": d.source.x0 + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.source.y0 + configJSON.rectangleHeight + 2
                                },
                                        {
                                            "x": d.source.x0 + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.source.y0 + configJSON.rectangleHeight + 2
                                },
                                        {
                                            "x": d.source.x0 + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.source.y0 + configJSON.rectangleHeight + 2
                                },
                                        {
                                            "x": d.source.x0 + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.source.y0 + configJSON.rectangleHeight + 2
                                }];
                                    return u_linedata;
                                })(d);
                                return _lineFunction(u_line);
                            });

                        // Transition links to their new position. 
                        link.transition()
                            .duration(configJSON.transitionDuration)
                            .attr("d", function (d) {
                                var u_line = (function (d) {
                                    var u_linedata = [{
                                            "x": d.source.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.source.y + configJSON.rectangleHeight
                                },
                                        {
                                            "x": d.source.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.target.y - 10
                                },
                                        {
                                            "x": d.target.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.target.y - 10
                                },
                                        {
                                            "x": d.target.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": d.target.y
                                }];
                                    return u_linedata;
                                })(d);
                                return _lineFunction(u_line);
                            });

                        // Transition exiting nodes to the parent's new position.
                        link.exit().transition()
                            .duration(configJSON.transitionDuration)
                            .attr("d", function (d) {
                                /* This is needed to draw the lines right back to the caller */
                                var u_line = (function (d) {
                                    var u_linedata = [{
                                            "x": _callerNode.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": _callerNode.y + configJSON.rectangleHeight + 2
                                },
                                        {
                                            "x": _callerNode.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": _callerNode.y + configJSON.rectangleHeight + 2
                                },
                                        {
                                            "x": _callerNode.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": _callerNode.y + configJSON.rectangleHeight + 2
                                },
                                        {
                                            "x": _callerNode.x + parseInt(configJSON.rectangleWidth / 2),
                                            "y": _callerNode.y + configJSON.rectangleHeight + 2
                                }];
                                    return u_linedata;
                                })(d);
                                return _lineFunction(u_line);
                            }).each("end", function () {
                                _callerNode = null; /* After transition clear the caller node variable */
                            });
                    } else if (configJSON.modus === "diagonal") {
                        // Enter any new links at the parent's previous position.
                        link.enter().insert("path", "g")
                            .attr("class", "link")
                            .attr("x", configJSON.rectangleWidth / 2)
                            .attr("y", configJSON.rectangleHeight / 2)
                            .attr("d", function (d) {
                                var o = {
                                    x: source.x0,
                                    y: source.y0
                                };
                                return _diagonal({
                                    source: o,
                                    target: o
                                });
                            });

                        // Transition links to their new position.
                        link.transition()
                            .duration(configJSON.transitionDuration)
                            .attr("d", _diagonal);

                        // Transition exiting nodes to the parent's new position.
                        link.exit().transition()
                            .duration(configJSON.transitionDuration)
                            .attr("d", function (d) {
                                var o = {
                                    x: source.x,
                                    y: source.y
                                };
                                return _diagonal({
                                    source: o,
                                    target: o
                                });
                            })
                            .remove();
                    }
                    // Stash the old positions for transition.
                    _nodes.forEach(function (d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });
                },
                // Toggle children on click.
                nodeclick = function (d) {
                    if (!d.children && !d._children && d.hasChild) {
                        // If there are no childs --> Try to load child nodes
                        _loadFunction(d, function (childs) {
                            var response = {
                                id: d.id,
                                desc: d.name,
                                children: childs.result
                            };

                            response.children.forEach(function (child) {
                                if (!_tree.nodes(d)[0]._children) {
                                    _tree.nodes(d)[0]._children = [];
                                }
                                child.x = d.x;
                                child.y = d.y;
                                child.x0 = d.x0;
                                child.y0 = d.y0;
                                _tree.nodes(d)[0]._children.push(child);
                            });

                            if (d.children) {
                                _callerNode = d;
                                _callerMode = 0; // Collapse
                                d._children = d.children;
                                d.children = null;
                            } else {
                                _callerNode = null;
                                _callerMode = 1; // Expand
                                d.children = d._children;
                                d._children = null;
                            }
                            update(d);
                        });
                    } else {
                        if (d.children) {
                            _callerNode = d;
                            _callerMode = 0; // Collapse
                            d._children = d.children;
                            d.children = null;
                        } else {
                            _callerNode = d;
                            _callerMode = 1; // Expand             
                            d.children = d._children;
                            d._children = null;
                        }
                        update(d);
                    }
                },
                treeSort = function (options) {
                    var cfi, e, i, id, o, pid, rfi, ri, thisid, _i, _j, _len, _len1, _ref, _ref1;
                    id = options.id || "id";
                    pid = options.parent_id || "parent_id";
                    ri = [];
                    rfi = {};
                    cfi = {};
                    o = [];
                    _ref = options.q;
                    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                        e = _ref[i];
                        rfi[e[id]] = i;
                        if (cfi[e[pid]] == null) {
                            cfi[e[pid]] = [];
                        }
                        cfi[e[pid]].push(options.q[i][id]);
                    }
                    _ref1 = options.q;
                    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        e = _ref1[_j];
                        if (rfi[e[pid]] == null) {
                            ri.push(e[id]);
                        }
                    }
                    while (ri.length) {
                        thisid = ri.splice(0, 1);
                        o.push(options.q[rfi[thisid]]);
                        if (cfi[thisid] != null) {
                            ri = cfi[thisid].concat(ri);
                        }
                    }
                    return o;
                },
                buildTree = function (options) {
                    var children, e, id, o, pid, temp, _i, _len, _ref;
                    id = options.id || "id";
                    pid = options.parent_id || "parent_id";
                    children = options.children || "children";
                    temp = {};
                    o = [];
                    _ref = options.q;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        e = _ref[_i];
                        e[children] = [];
                        temp[e[id]] = e;
                        if (temp[e[pid]] != null) {
                            temp[e[pid]][children].push(e);
                        } else {
                            o.push(e);
                        }
                    }
                    return o;
                },
                //Redraw for zoom
                redraw = function () {
                    _svg.attr("transform", "translate(" + d3.event.translate + ")" +
                        " scale(" + d3.event.scale.toFixed(1) + ")");
                },
                drawChart = function () {
                    $(configJSON.regionID).empty(); // Reset
                    try {
                        width = $(configJSON.regionID).innerWidth();
                        height = $(configJSON.regionID).innerHeight();
                        _tree = d3.layout.tree().nodeSize([configJSON.rectangleWidth + configJSON.rectangleSpacing, configJSON.rectangleHeight + configJSON.rectangleSpacing]);
                        /* Basic Setup for the diagonal function. configJSON.modus = "diagonal" */
                        _diagonal = d3.svg.diagonal()
                            .projection(function (d) {
                                return [d.x + configJSON.rectangleWidth / 2, d.y + configJSON.rectangleHeight / 2];
                            });
                        /* Basic setup for the line function. configJSON.modus = "line" */
                        _lineFunction = d3.svg.line()
                            .x(function (d) {
                                return d.x;
                            })
                            .y(function (d) {
                                return d.y;
                            })
                            .interpolate("linear");
                        if (_root.children) {
                            u_childwidth = parseInt((_root.children.length * configJSON.rectangleWidth) / 2);
                        } else {
                            u_childwidth = parseInt((_root._children.length * configJSON.rectangleWidth) / 2);
                        }
                        _svgroot = d3.select(configJSON.regionID).append("svg").attr("width", width).attr("height", height)
                            .call(zm = d3.behavior.zoom().scaleExtent([0.15, 3]).on("zoom", redraw));

                        _svg = _svgroot.append("g")
                            .attr("transform", "translate(" + parseInt(u_childwidth + ((width - u_childwidth * 2.4) / 2)) + "," + 20 + ")");

                        defBoxShadow("boxShadow");

                        //necessary so that zoom knows where to zoom and unzoom from
                        zm.translate([parseInt(u_childwidth + ((width - u_childwidth * 2.4) / 2)), 20]);
                        _root.x0 = 0; // the root is already centered
                        _root.y0 = height / 2; // draw & animate from center
                        if (_root.children) {
                            _root.children.forEach(collapse);
                        } else {
                            _root.children = _root._children;
                            _root.children.forEach(collapse);
                        }
                        update(_root);
                        d3.select(configJSON.regionID).style("height", height);
                    } catch (e) {
                        util.loader.stop(configJSON.regionID);
                        console.log("error while try draw Chart");
                        console.log(e);
                    }
                },
                buildData = function (data) {
                    try {
                        /* draw cards and add it to the rows */
                        if (data.row && data.row.length > 0) {

                            _root = util.convertJSON2LowerCase(data.row);

                            var dataArr = [];

                            for (var i in _root) {
                                dataArr.push(_root[i]);
                            }
                            _root = treeSort({
                                q: dataArr
                            });

                            _root = buildTree({
                                q: _root
                            });
                            _root = _root[0];

                            drawChart();
                        } else {
                            $(configJSON.regionID).empty();
                            util.noDataMessage.show(configJSON.regionID, configJSON.noDataMessage);
                        }
                    } catch (e) {
                        util.loader.stop(configJSON.regionID);
                        $(configJSON.regionID).empty();
                        console.log("error while try to prepare data for draw Chart");
                        console.log(e);
                    }
                },
                getData = function (sucFunction) {
                    util.loader.start(configJSON.regionID);

                    apex.server.plugin(
                        configJSON.ajaxID, {
                            pageItems: configJSON.items2Submit
                        }, {
                            success: sucFunction,
                            error: function (d) {
                                util.loader.stop(configJSON.regionID);
                                $(configJSON.regionID).empty();
                                console.log(d.responseText);
                            },
                            dataType: "json"
                        });
                };

            // get data from db and draw chart
            getData(buildData);

            // reset wen open context menu with mouse
            $(configJSON.regionID).contextmenu(function () {
                drawChart();
                return false;
            });

            // bind dynamic action refresh
            $("#" + regionID.substring(6)).bind("apexrefresh", function () {
                if ($(configJSON.regionID).children('span').length == 0) {
                    getData(buildData);
                }
            });

            // set timer if auto refresh is set
            if (configJSON.refresh > 0) {
                setInterval(function () {
                    if ($(configJSON.regionID).children('span').length == 0) {
                        getData(buildData);
                    }
                }, configJSON.refresh * 1000);
            }

            // resize on resize browser
            apex.jQuery(window).on("apexwindowresized", function (event) {
                width = $(configJSON.regionID).innerWidth();
                height = $(configJSON.regionID).innerHeight();
                if (_root.children) {
                    u_childwidth = parseInt((_root.children.length * configJSON.rectangleWidth) / 2);
                } else {
                    u_childwidth = parseInt((_root._children.length * configJSON.rectangleWidth) / 2);
                }
                _svg.attr("transform", "translate(" + parseInt(u_childwidth + ((width - u_childwidth * 2.4) / 2)) + "," + 20 + ")");
                zm.translate([parseInt(u_childwidth + ((width - u_childwidth * 2.4) / 2)), 20]);
                _svgroot.attr("width", width)
                    .attr("height", height);
            });
        }
    };
})();
