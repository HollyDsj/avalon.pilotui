//avalon 1.2.5 2014.4.2
define(["avalon",
    "text!avalon.tabs.tab.html",
    "text!avalon.tabs.panel.html",
    "text!avalon.tabs.close.html"],
        function(avalon, tabHTML, panelHTML, closeHTML) {
            var styleEl = document.getElementById("avalonStyle")
          var widget =  avalon.ui.tabs = function(element, data, vmodels) {
                var el, tabsParent, tabs = [], tabpanels = [], options = data.tabsOptions

                // 清空它内部所有节点，并收集其内容，构建成tabs与tabpanels两个数组
                while (el = element.firstChild) {
                    if (el.tagName === "UL" || el.tagName === "OL") {
                        tabsParent = el
                    }
                    if (el.tagName === "DIV") {
                        tabpanels.push({
                            content: el.innerHTML,
                            contentType: 'content'
                        })
                    }
                    element.removeChild(el)
                }

                for (var i = 0; el = tabsParent.children[i++]; ) {
                    var tabOptions = avalon(el).data()
                    tabs.push({
                        title: el.innerHTML,
                        disabled: tabOptions.disabled == undefined ? false : tabOptions.disabled
                    })
                }

                var inited = false

                var vmodel = avalon.define(data.tabsId, function(vm) {
                    avalon.mix(vm, options)

                    vm.$init = function() {//初始化 组件的界面
                        if (!inited) {
                            inited = true
                            vm.tabs = tabs
                            vm.tabpanels = tabpanels
                            avalon.nextTick(function() {
                                avalon(element).addClass("ui-tabs ui-widget ui-widget-content ui-corner-all")
                                // 设置动态模板，注意模块上所有占位符都以“MS_OPTION_XXX”形式实现
                                var tablist = tabHTML
                                        .replace("MS_OPTION_EVENT", vmodel.event)
                                        .replace("MS_OPTION_REMOVABLE", vmodel.removable ? closeHTML : "")
                                //决定是重复利用已有的元素，还是通过ms-include-src引入新内部
                                var contentType = options.contentType === "content" ? 0 : 1
                                var panels = panelHTML.split("MS_OPTION_CONTENT")[contentType]
                                //jquery ui的.ui-helper-clearfix 类不支持对IE6清除浮动，这时需要fix一下
                                if (!avalon.ui.fixUiHelperClearfix && typeof styleEl.style.maxHeight == "undefined") {
                                    styleEl.styleSheet.cssText += ".ui-helper-clearfix {_zoom:1;}"
                                    avalon.ui.fixUiHelperClearfix = true
                                }
                                element.innerHTML = vmodel.bottom ? panels + tablist : tablist + panels
                                element.setAttribute("ms-class-1", "ui-tabs-collapsible:collapsible")
                                element.setAttribute("ms-class-2", "tabs-bottom:bottom")

                                avalon.scan(element, [vmodel].concat(vmodels))

                            })
                        }
                    }
                    vm.$remove = function() {//清空构成UI的所有节点
                        element.innerHTML = element.textContent = ""
                    }
                    vm.tabs = []
                    vm.tabpanels = []
                    vm.disable = function(index, disable) {
                        disable = typeof disable == "undefined" ? true : disable
                        if (!avalon.isArray(index)) {
                            index = [index]
                        }
                        var total = vm.tabs.length
                        index.forEach(function(idx) {
                            if (idx >= 0 && total > idx) {
                                vm.tabs[idx].disabled = disable
                            }
                        })
                    }
                    vm.enable = function(index) {
                        vm.disable(index, false)
                    }
                    vm.add = function(config) {
                        var title = config.title || 'Tab Tile'
                        var content = config.content || '<div></div>'
                        var exsited = false
                        vm.tabpanels.forEach(function(panel) {
                            if (panel.contentType == 'include' && panel.content == config.content) {
                                exsited = true
                            }
                        })
                        if (exsited === true) {
                            return
                        }
                        vm.tabpanels.push({
                            content: content,
                            contentType: config.contentType
                        })
                        vm.tabs.push({
                            title: title,
                            disabled: false
                        })
                        if (config.actived) {
                            avalon.nextTick(function() {
                                vmodel.active = vmodel.tabs.length - 1
                            })
                        }
                    }
                    vm.activate = function(event, index) {
                        event.preventDefault()
                        if (vm.tabs[index].disabled === true) {
                            return
                        }
                        if (vm.event === 'click' && vm.active === index && vm.collapsible) {
                            vm.active = NaN
                            return
                        }

                        if (vm.active !== index) {
                            avalon.nextTick(function() {
                                var elem = this
                                vm.active = index
                                options.activate.call(elem, event, vmodel)
                            })
                        }
                    }
                    vm.remove = function(e, index) {
                        e.preventDefault()
                        e.stopPropagation()
                        if (vmodel.tabs[index].disabled === true) {
                            return
                        }
                        vmodel.tabs.removeAt(index)
                        vmodel.tabpanels.removeAt(index)
                        index = index > 1 ? index - 1 : 0
                        avalon.nextTick(function() {
                            vmodel.active = index
                        })
                        vm.bottom = options.bottom
                    }
                })
                return vmodel
            }
            widget.defaults = {
                collapsed: false,
                active: 0, //默认打开第几个面板
                event: "click", //切换面板的事件，移过(mouseenter)还是点击(click)
                collapsible: false, //当切换面板的事件为click时，
                //如果对处于激活状态的按钮再点击，将会它失去激活并且对应的面板会收起来
                //再次点击它时，它还原，并且对应面板重新出现
                bottom: false, //按钮位于上方还是上方
                removable: false, //按钮的左上角是否出现X，用于移除按钮与对应面板
                activate: avalon.noop, // 切换面板后触发的回调
                contentType: "content"
            }
            return avalon
        })
        /**
avalon.tabs要求在绑定的元素内部 指定内容， 结构大致如下
  <ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
  </ul>
  <div >
    Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
  </div>
  <div >
    Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
  </div>
  <div >
    Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
  </div>
上方是无序列表或有序列表
下方是一组DIV，DIV的个数与LI元素的个数相同
         */