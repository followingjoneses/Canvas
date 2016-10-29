function sortNumber(a,b) {
    return a - b
}

//将utils定义为window对象下的一个属性，属性值为对象
window.utils = {};

//在utils对象上定义捕获坐标的方法
window.utils.captureMouse = function(element){
    //定义一个名为mouse的对象
    var mouse = {x:0,y:0};

    //为元素绑定mousemove事件
    element.addEventListener('mousemove',function(event){
        var x,y;

        //获取鼠标位于当前屏幕的位置， 并作兼容处理
        if(event.pageX||event.pageY){
            x = event.pageX;
            y = event.pageY;
        }else{
            x = event.clientX + document.body.scrollLeft +document.documentElement.scrollLeft;
            y = event.clientY + document.body.scrollTop +document.documentElement.scrollTop;
        }
        //将当前的坐标值减去元素的偏移位置，即为鼠标位于当前canvas的位置
        x -= element.offsetLeft;
        y -= element.offsetTop;

        mouse.x = x;
        mouse.y = y;
    },false);
    //返回值为mouse对象
    return mouse;
};

function drawPoint(cxt,x,y, color)
{
    //建立一条新的路径
    cxt.beginPath();
    //设置画笔的颜色
    cxt.strokeStyle ="rgb("+color[0] + "," +
        +color[1] + "," +
        +color[2] + ")" ;
    //设置路径起始位置
    cxt.moveTo(x,y);
    //在路径中添加一个节点
    cxt.lineTo(x+1,y+1);
    //用画笔颜色绘制路径
    cxt.stroke();
}

function drawLine(cxt,x1,y1,x2,y2,color){
    cxt.beginPath();
    cxt.strokeStyle ="rgba("+color[0] + "," +
        +color[1] + "," +
        +color[2] + "," +
        +255 + ")" ;
    //这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
    cxt.lineWidth =1;
    cxt.moveTo(x1, y1);
    cxt.lineTo(x2, y2);
    cxt.stroke();
}

function determineLines(y, ys) {
    var l1 = -1, l2 = -1, l3 = -1, l4 = -1;
    for (var i=0;i<4;i++) {
        if (ys[i]<=y && ys[(i+1)%4]>y || ys[i]>y && ys[(i+1)%4]<=y) {
            if (l1 == -1) {
                l1 = i;
            } else if (l2 == -1) {
                l2 = i;
            } else if (l3 == -1) {
                l3 = i;
            } else {
                l4 = i;
                break;
            }
        }
    }
    return [l1, l2, l3, l4];
}

function drawPolygon(ctx, xs, ys, color) {
    var yMin = Infinity;
    var minIndex;
    var yMax = 0;
    var maxIndex;
    var otherIndexes = [];

    var lines = [];

    for (var i=0;i<4;i++) {
        if (ys[i] < yMin) {
            yMin = ys[i];
            minIndex = i;
        }
        if (ys[i] > yMax) {
            yMax = ys[i];
            maxIndex = i;
        }
    }
    var count = 0;
    for (i=0;i<4;i++) {
        if (i!=minIndex&&i!=maxIndex) {
            otherIndexes[count] = i;
            count++;
        }
    }
    var parallels = [ys[0]==ys[1], ys[1]==ys[2], ys[2]==ys[3], ys[3]==ys[0]];

    for (i=0;i<4;i++) {
        if (parallels[i]) {
            lines[i] = {parallel: true, y: ys[i], x1: xs[i], x2: xs[(i+1)%4]};
        } else {
            lines[i] = {parallel: false, y1: ys[i], y2: ys[(i+1)%4], x1: xs[i], x2: xs[(i+1)%4],
                k: (xs[(i+1)%4]-xs[i])/(ys[(i+1)%4]-ys[i]), b:(xs[i]*ys[(i+1)%4]-xs[(i+1)%4]*ys[i])/(ys[(i+1)%4]-ys[i])};
        }
    }

    for (var pixel=yMin;pixel<=yMax;pixel++) {
        if (pixel == yMin) {
            if (lines[minIndex].parallel) {
                drawLine(ctx, lines[minIndex].x1, lines[minIndex].y, lines[minIndex].x2, lines[minIndex].y, color)
            }
            if (lines[(minIndex+3)%4].parallel) {
                drawLine(ctx, lines[(minIndex+3)%4].x1, lines[(minIndex+3)%4].y1, lines[(minIndex+3)%4].x2, lines[(minIndex+3)%4].y2, color)
            }
            if (!lines[minIndex].parallel && !lines[(minIndex+3)%4].parallel) {
                drawPoint(ctx, xs[minIndex], pixel, color);
            }
            continue;
        }
        if (pixel == yMax) {
            if (lines[maxIndex].parallel) {
                drawLine(ctx, lines[maxIndex].x1, lines[maxIndex].y, lines[maxIndex].x2, lines[maxIndex].y, color)
            }
            if (lines[(maxIndex+3)%4].parallel) {
                drawLine(ctx, lines[(maxIndex+3)%4].x1, lines[(maxIndex+3)%4].y1, lines[(maxIndex+3)%4].x2, lines[(maxIndex+3)%4].y2, color)
            }
            if (!lines[maxIndex].parallel && !lines[(maxIndex+3)%4].parallel) {
                drawPoint(ctx, xs[maxIndex], pixel, color);
            }
            continue;
        }
        if (pixel==ys[otherIndexes[0]] && pixel==ys[otherIndexes[1]]) {
            drawLine(ctx, xs[otherIndexes[0]], pixel, xs[otherIndexes[1]], pixel, color);
        }

        var lineIndexes = determineLines(pixel, ys);
        if (lineIndexes[2]==-1 && lineIndexes[3]==-1) {
            var nodes = [Math.floor(lines[lineIndexes[0]].k*pixel+lines[lineIndexes[0]].b),
                Math.floor(lines[lineIndexes[1]].k*pixel+lines[lineIndexes[1]].b)];
            var left, right;
            if (nodes[0]>nodes[1]) {
                left = nodes[1];
                right = nodes[0];
            } else if (nodes[0]<nodes[1]) {
                left = nodes[0];
                right = nodes[1];
            } else {
                left = right = nodes[0];
            }

            if (left == right) {
                drawPoint(ctx, left, pixel, color);
            } else {
                drawLine(ctx, left, pixel, right, pixel, color);
            }
        } else {
            var nodes = [Math.floor(lines[lineIndexes[0]].k*pixel+lines[lineIndexes[0]].b),
                Math.floor(lines[lineIndexes[1]].k*pixel+lines[lineIndexes[1]].b),
                Math.floor(lines[lineIndexes[2]].k*pixel+lines[lineIndexes[2]].b),
                Math.floor(lines[lineIndexes[3]].k*pixel+lines[lineIndexes[3]].b)];
            nodes = nodes.sort(sortNumber);
            if (nodes[0]!=nodes[1]) {
                drawLine(ctx, nodes[0], pixel, nodes[1], pixel, color);
            } else {
                drawPoint(ctx, nodes[0], pixel, color);
            }
            if (nodes[2]!=nodes[3]) {
                drawLine(ctx, nodes[2], pixel, nodes[3], pixel, color);
            } else {
                drawPoint(ctx, nodes[2], pixel, color);
            }
        }
    }
}

window.onload = function () {
    var c = document.getElementById("myCanvas");
    c.width = canvasSize.maxX;
    c.height = canvasSize.maxY;
    var mouse = utils.captureMouse(c);
    var ctx = c.getContext("2d");
    ctx.translate(0.5, 0.5);

    for (i=0;i<4;i++) {
        var xs = [vertex_pos[polygon[i][0]][0], vertex_pos[polygon[i][1]][0], vertex_pos[polygon[i][2]][0], vertex_pos[polygon[i][3]][0]];
        var ys = [vertex_pos[polygon[i][0]][1], vertex_pos[polygon[i][1]][1], vertex_pos[polygon[i][2]][1], vertex_pos[polygon[i][3]][1]];
        drawPolygon(ctx, xs, ys, vertex_color[polygon[i][0]]);
    }

    for (var i=0;i<vertex_pos.length;i++) {
        ctx.beginPath();
        ctx.arc(vertex_pos[i][0], vertex_pos[i][1], 10, 0, 2*Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.stroke();
    }

    var w = 0, h = 0, index=0;
    c.addEventListener('mousedown', function(event){
        for (var i=0;i<9;i++) {
            var dx = mouse.x - vertex_pos[i][0];
            var dy = mouse.y - vertex_pos[i][1];
            var dist = Math.sqrt(dx*dx+dy*dy);
            if (dist<10) {
                index = i;
                w = mouse.x - vertex_pos[i][0];
                h = mouse.y - vertex_pos[i][1];
                c.addEventListener('mouseup', onMouseUp, false);
                c.addEventListener('mousemove', onMouseMove, false);
            }
        }
    }, false);

    function onMouseUp(event){
        c.removeEventListener('mouseup', onMouseUp, false);
        c.removeEventListener('mousemove', onMouseMove, false);
    }

    function onMouseMove(event){
        vertex_pos[index][0] = mouse.x - w;
        vertex_pos[index][1] = mouse.y - h;
        paint();
    }

    function paint() {
        c.width = c.width;
        c.height = c.height;
        for (i=0;i<4;i++) {
            var xs = [vertex_pos[polygon[i][0]][0], vertex_pos[polygon[i][1]][0], vertex_pos[polygon[i][2]][0], vertex_pos[polygon[i][3]][0]];
            var ys = [vertex_pos[polygon[i][0]][1], vertex_pos[polygon[i][1]][1], vertex_pos[polygon[i][2]][1], vertex_pos[polygon[i][3]][1]];
            drawPolygon(ctx, xs, ys, vertex_color[polygon[i][0]]);
        }

        for (var i=0;i<vertex_pos.length;i++) {
            ctx.beginPath();
            ctx.arc(vertex_pos[i][0], vertex_pos[i][1], 10, 0, 2*Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.stroke();
        }
    }
};