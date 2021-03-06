angular
    .module('simple-context-menu', [])
    .directive('contextMenu', contextMenu);

contextMenu.$inject = ['$parse', '$q'];

function contextMenu($parse, $q) {
    var contextMenus = [];

    var removeContextMenus = function(level) {
        while (contextMenus.length && (!level || contextMenus.length > level)) {
            contextMenus.pop().remove();
        }
        if (contextMenus.length == 0 && $currentContextMenu) {
            $currentContextMenu.remove();
        }
    };

    var $currentContextMenu = null;

    var renderContextMenu = function($scope, event, options, model, disabledFunc, itemName, level) {
        if (!level) {
            level = 0;
        }
        if (!$) {
            var $ = angular.element;
        }
        $(event.currentTarget).addClass('context');
        var $contextMenu = $('<div>');
        if ($currentContextMenu) {
            $contextMenu = $currentContextMenu;
        } else {
            $currentContextMenu = $contextMenu;
        }
        $contextMenu.addClass('dropdown clearfix');
        var $ul = $('<ul>');
        $ul.addClass('dropdown-menu');
        $ul.attr({'role': 'menu'});
        $ul.css({
            display: 'block',
            position: 'absolute',
            left: event.pageX + 'px',
            top: event.pageY + 'px',
            "z-index": 10000
        });
        angular.forEach(options, function (item, i) {
            var $li = $('<li>');
            if (item === null) {
                $li.addClass('divider');
            } else {
                var nestedMenu = item.children || false;
                var openNestedMenu = function($event) {
                    removeContextMenus(level + 1);
                    var ev = {
                        pageX: event.pageX + $ul[0].offsetWidth - 1,
                        pageY: $ul[0].offsetTop + $li[0].offsetTop - 3
                    };
                    renderContextMenu($scope, ev, item.children, model, disabledFunc, itemName, level + 1);
                };
                $li.on('click', function($event) {
                    //$event.preventDefault();
                    $scope.$apply(function() {
                        if (nestedMenu) {
                            openNestedMenu($event);
                        } else {
                            if(item.disable !== false){
                                $(event.currentTarget).removeClass('context');
                                removeContextMenus();
                                item.action.call($scope, itemName, event);
                            }
                        }
                    });
                });
                $li.on('mouseover', function($event) {
                    $scope.$apply(function() {
                        if (nestedMenu) {
                            openNestedMenu($event);
                        }
                    });
                });

                var $a = $('<a>');
                $a.css("padding-right", "8px");
                $a.attr({tabindex: '-1', href: '#'});
                var text = item.displayName;
                $q.when(text).then(function(text) {
                    $a.text(text);
                    if (nestedMenu) {
                        $a.css("cursor", "default");
                        $a.append($('<strong style="font-family:monospace;font-weight:bold;float:right;">&gt;</strong>'));
                    }
                });
                if(item.disable || disabledFunc(item)){
                    $li.addClass('disabled');
                }
                $li.append($a);
            }
            $ul.append($li);
        });
        $contextMenu.append($ul);
        var height = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        $contextMenu.css({
            width: '100%',
            height: height + 'px',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);
        $contextMenu
          .on("mousedown", function (e) {
            if ($(e.target).hasClass('dropdown')) {
                $(event.currentTarget).removeClass('context');
                removeContextMenus();
            }
        })
          .on('contextmenu', function (event) {
            $(event.currentTarget).removeClass('context');
            event.preventDefault();
            removeContextMenus(level);
        });
        $scope.$on("$destroy", function() {
            removeContextMenus();
        });

        contextMenus.push($ul);
    };
    return {
        restrict: 'A',
        scope: {
            contextMenu: '=',
            itemName: '=',
            disabledFunc:'&'
        },
        link: function($scope, element, attrs) {
            element.on('contextmenu', function(event) {
                event.stopPropagation();
                $scope.$apply(function() {
                    event.preventDefault();
                    var model = $scope.$eval(attrs.model);
                    if ($scope.contextMenu instanceof Object) {
                        if ($scope.contextMenu.length === 0) {
                            return;
                        }
                        renderContextMenu($scope, event, $scope.contextMenu, model, $scope.disabledFunc, $scope.itemName);
                    } else {
                        throw '"' + attrs.contextMenu + '" not an object';
                    }
                });
            });
        }
    };
};
