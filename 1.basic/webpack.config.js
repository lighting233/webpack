const { resolve ,join,basename} = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
/* let devConfig={}
let prodConfig={};
let config = process.env.NODE_ENV==='production'?prodConfig:devConfig; */
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const dotenv = require('dotenv');
require('dotenv').config({
    path:resolve(__dirname,'.qa.env')
});
console.log('process.env.NODE_ENV',process.env.NODE_ENV);
module.exports = (env)=>({
    // mode 当前的运行模式  开发环境  生产环境 不指定环境
    mode: process.env.NODE_ENV,
    devtool: 'hidden-source-map',
    //对于入口来说，name就是entry的key,字符串就是main
    //对于非入口来说 
      //import('./src/title.js') src_title_js
      //代码分割 vendor common自己指定的
    entry:{
        main:'./src/index.js',
        vendor:['jquery','lodash']
    },
    /* optimization:{
        splitChunks:{
            chunks:'all'//讲完webpack原理之后会可以讲这个
            vendor,
            commons
        }
    }, */
    output: {
        //Output中filename和chunkFilename区别是啥 
        path: resolve(__dirname, 'dist'), // 输出文件夹的绝对路径  __dirname当前文件所在目录的绝对路径
        //入口模块
        filename: '[name].[chunkhash:5].js', // 输出的文件名
        //非入口模块 import splitChunks
        chunkFilename:'[name].[chunkhash:5].js',
        //当你把打包后文件插入index。html文件里的时候，src写法publicPath+filename
        publicPath:'/'
    },
    //为了提高性能，使用内存文件系统
    //默认情况下devServer会读取打包后的路径,目录可以有多份，找不到找下一个
    devServer: {
        contentBase: resolve(__dirname, 'static'), //想使用静态文件时需要，例如html里有一个静态文件，dist目录里没有，放到static文件夹下
        publicPath:'/', 
        writeToDisk: true, //指定此项会把打包后的文件写入硬盘一份
        compress: true, /// 是否启动压缩 gzip
        port: 8080, // 指定HTTP服务器的端口号
        open: true, // 自动打开浏览器
    },
    externals: {
        lodash: '_',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'eslint-loader', // 先进行代码校验，然后再编译代码
                enforce: 'pre', // 强制指定顺序 pre 之前 pre normal inline post
                options: { fix: true }, // 启动自动修复
                include: resolve(__dirname, 'src'), // 只检查src目录里面的文件 白名单
                // exclude:/node_modules/ //不需要检查node_modules里面的代码 黑名单
            },
            /*
            1.先把ES6转成ES6语法树 babelCore
            2.然后调用预设preset-env把ES6语法树转成ES5语法树 preset-env
            3.再把ES5语法树重新生成es5代码 babelCore
            */
            {
                test: /\.jsx?$/, //js或jsx
                use: [
                    {
                        loader: 'babel-loader',//作用是调用babelCore babelCore本身只是提供一个过程管理功能，把源代码转成抽象语法树，进行遍历和生成，它本身也并不知道 具体要转换什么语法，以及语法如何转换
                        options: {
                            //预设是插件的集合
                            presets: [
                                [
                                    "@babel/preset-env",//可以转换js语法
                                    "@babel/preset-react",//可以转换JSX语法
                                ],
                            ],
                            plugins: [
                                ["@babel/plugin-proposal-decorators", { legacy: true }], //装饰器插件
                                ["@babel/plugin-proposal-class-properties", { loose: true }], //类的属性插件
                            ],
                        },
                    },
                ],
            },
            //用MiniCssExtractPlugin.loader替换掉style-loader
            //把所有的css样式先收集起来
            { test: /\.css$/, use: [
                MiniCssExtractPlugin.loader, 
                'css-loader',
                {
                    loader:'postcss-loader',
                    options:{
                        postcssOptions: {
                            plugins: [
                                "postcss-preset-env"
                            ],
                        },
                    }
            },
            {
                loader:'px2rem-loader',
                options:{
                    remUnit:75
                }
            }] },
            //style-loader把css文件当成脚本插入html，css-loader处理@import和background：url()等
            { test: /\.less$/, use: [MiniCssExtractPlugin.loader, 'css-loader','postcss-loader', 'less-loader'] },
            { test: /\.scss$/, use: [MiniCssExtractPlugin.loader, 'css-loader','postcss-loader', 'sass-loader'] },
            {
                test: /\.(jpg|png|gif|bmp)$/,
                use: [{
                    loader: 'url-loader', //url-loader依赖file-loader，直接装url-loader就可以了
                    options: {
                        name: '[hash:10].[ext]',
                        esModule: false,
                        limit: 32 * 1024,
                        outputPath:'images',//指定输出图片的目录images目录 
                        //加上/就是相对于根路径，不加/就是相对于当前的文件相对路径
                        //  /css/main.css /css/images/hash.png
                        publicPath:'/images'//访问图片的话也需要去images目录里找
                    },
                }],
            },
            //多个loader从右向左执行
            //html-loader作用是解析html中图片的相对路径<img src="./images/logo.png">
            { test: /\.html$/, use: ['html-loader'] },
            { test: /\.(jpg|png|gif|bmp)$/, use:[{
                loader: 'file-loader',
                option: {
                    name: '[hash:10].[ext]',
                    esModule: false,
                    limit: 128*1024 // 如果体积小于limit就转成BASE64字符串内嵌
                }
            }]}
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename:'index.html'
        }),
        //把收集到的所有的CSS样式都写入到main.css,然后现把此资源插入到HTML里去
        new MiniCssExtractPlugin({
            //只要CSS内容不变，contenthash就不会变
            filename:'[name].[contenthash:5].css'
        }),
        false
    ].filter(Boolean),
   
});
//glob文件匹配模式 *可以匹配任意字符，除了路径分隔, 符 **可以匹配任意字符，包括路径分隔符
