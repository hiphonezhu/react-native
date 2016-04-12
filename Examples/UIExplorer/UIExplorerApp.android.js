/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @providesModule UIExplorerApp
 * @flow
 */
'use strict';

const React = require('react-native'); // 引入react-native模块
// 导入需要使用到的组件
const {
  AppRegistry,
  BackAndroid,
  Dimensions,
  DrawerLayoutAndroid,
  NavigationExperimental,
  StyleSheet,
  ToolbarAndroid,
  View,
  StatusBar,
} = React;
const {
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;
// 导入其他js
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerList = require('./UIExplorerList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');

// 抽屉占整个屏幕的剩余宽度
var DRAWER_WIDTH_LEFT = 56;

// 定义组件
class UIExplorerApp extends React.Component {
  /**
   * 组件将要加载
   */
  componentWillMount() {
    // 绑定返回键
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButtonPress.bind(this));
  }

  /**
   * 组件渲染，返回NavigationRootContainer
   * @returns {XML}
     */
  render() {
    return (
      <NavigationRootContainer
        persistenceKey="UIExplorerStateNavState"
        ref={navRootRef => { this._navigationRootRef = navRootRef; }}
        reducer={UIExplorerNavigationReducer}
        renderNavigation={this._renderApp.bind(this)}
      />
    );
  }

  /**
   * 抽屉
   * @param navigationState
   * @param onNavigate
   * @returns {*}
     * @private
     */
  _renderApp(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <DrawerLayoutAndroid
        drawerPosition={DrawerLayoutAndroid.positions.Left} // 抽屉位置（左侧）
        drawerWidth={Dimensions.get('window').width - DRAWER_WIDTH_LEFT} // 抽屉宽度=屏幕宽度-预留宽度
        keyboardDismissMode="on-drag" // 指定在拖拽的过程中是否要隐藏软键盘(on-drag： 当拖拽开始的时候隐藏软键盘  none：(默认值)，拖拽不会隐藏软键盘)
        onDrawerOpen={() => { // 每当导航视图（抽屉）被打开之后调用此回调函数
          this._overrideBackPressForDrawerLayout = true; // 标记位，效果是按返回的时候会关闭抽屉
        }}
        onDrawerClose={() => {
          this._overrideBackPressForDrawerLayout = false; // 标记位，效果是按返回的时候会关闭app
        }}
        ref={(drawer) => { this.drawer = drawer; }}
        // 此方法用于渲染一个可以从屏幕一边拖入的导航视图
        renderNavigationView={this._renderDrawerContent.bind(this, onNavigate)}>
        {this._renderNavigation(navigationState, onNavigate)}
      </DrawerLayoutAndroid>
    );
  }

  /**
   * 左侧抽屉的内容
   * @param onNavigate
   * @returns {XML}
   * @private
     */
  _renderDrawerContent(onNavigate) {
    return (
      <UIExplorerExampleList
        list={UIExplorerList}
        displayTitleRow={true}
        disableSearch={true}
        onNavigate={(action) => {
          this.drawer && this.drawer.closeDrawer();
          onNavigate(action);
        }}
      />
    );
  }

  /**
   * 根据状态等判断右侧显示具体内容
   * @param navigationState
   * @param onNavigate
   * @returns {XML}
     * @private
     */
  _renderNavigation(navigationState, onNavigate) {
    if (navigationState.externalExample) {
      var Component = UIExplorerList.Modules[navigationState.externalExample];
      return (
        <Component
          onExampleExit={() => {
            onNavigate(NavigationRootContainer.getBackAction());
          }}
          ref={(example) => { this._exampleRef = example; }}
        />
      );
    }
    const {stack} = navigationState;
    const title = UIExplorerStateTitleMap(stack.children[stack.index]);
    const index = stack.children.length <= 1 ?  1 : stack.index;

    // 显示例子详情
    if (stack && stack.children[index]) {
      const {key} = stack.children[index];
      const ExampleModule = UIExplorerList.Modules[key];
      const ExampleComponent = UIExplorerExampleList.makeRenderable(ExampleModule);
      return (
        <View style={styles.container}>
          <StatusBar
            backgroundColor="#589c90"
          />
          <ToolbarAndroid
            logo={require('image!launcher_icon')}
            navIcon={require('image!ic_menu_black_24dp')}
            onIconClicked={() => this.drawer.openDrawer()}
            style={styles.toolbar}
            title={title}
          />
          <ExampleComponent
            ref={(example) => { this._exampleRef = example; }}
          />
        </View>
      );
    }

    // 显示所有例子列表
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="#589c90"
        />
        <ToolbarAndroid
          logo={require('image!launcher_icon')}
          navIcon={require('image!ic_menu_black_24dp')}
          onIconClicked={() => this.drawer.openDrawer()}
          style={styles.toolbar}
          title={title}
        />
        <UIExplorerExampleList
          list={UIExplorerList}
          {...stack.children[0]}
        />
      </View>
    );
  }

  /**
   * 处理返回事件
   * @returns {*}
   * @private
     */
  _handleBackButtonPress() {
    // 抽屉是否拦截事件，是关闭抽屉
    if (this._overrideBackPressForDrawerLayout) {
      // This hack is necessary because drawer layout provides an imperative API
      // with open and close methods. This code would be cleaner if the drawer
      // layout provided an `isOpen` prop and allowed us to pass a `onDrawerClose` handler.
      this.drawer && this.drawer.closeDrawer();
      return true;
    }
    // 例子详情是否拦截事件
    if (
      this._exampleRef &&
      this._exampleRef.handleBackAction &&
      this._exampleRef.handleBackAction()
    ) {
      return true;
    }
    // 都不处理交给导航控制器处理返回事件
    if (this._navigationRootRef) {
      return this._navigationRootRef.handleNavigation(
        NavigationRootContainer.getBackAction()
      );
    }
    return false;
  }
}

// 定义样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: '#E9EAED',
    height: 56,
  },
});

// 注册组件
AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

// 导出模块
module.exports = UIExplorerApp;
