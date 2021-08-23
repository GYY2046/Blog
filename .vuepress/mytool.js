//自动生成侧边栏

const fs = require('fs')
    // const path1 = require('path')

function autoSideBar(path) {
    let root = []
    readDirSync(path, root)
    root = root.map(m => {
        return m.replace(".md", "").replace("README", "");
    })
    console.log(root);
    // root = root.map(item => {
    //         if (item.split('/')[4]) {
    //             return item.split('/')[3] + '/' + item.split('/')[4]
    //         } else {
    //             return item.split('/')[3]
    //         }

    //     })
    //     //排序
    // if (sort) {
    //     let sortList = []
    //     let nosortList = []
    //     console.log('root-' + root);
    //     root.forEach(item => {
    //         if (Number(item.replace(".md", "").match(/[^-]*$/))) {
    //             sortList.push(item)
    //         } else {
    //             nosortList.push(item)
    //         }
    //     })
    //     root = sortList.sort(function(a, b) {
    //         return a.replace(".md", "").match(/[^-]*$/) - b.replace(".md", "").match(/[^-]*$/)
    //     }).concat(nosortList)
    // }

    return root
}

function readDirSync(path, root) {
    var pa = fs.readdirSync(path);
    console.log('readDir' + pa);
    pa.forEach(function(ele, index) {
        var info = fs.statSync(path + "/" + ele)
        if (info.isDirectory()) {
            readDirSync(path + ele, root)
        } else {
            if (checkFileType(ele)) {
                root.push(ele)
            }
        }
    })
}

function checkFileType(path) {
    return path.includes(".md")
}

module.exports = { autoSideBar: autoSideBar }