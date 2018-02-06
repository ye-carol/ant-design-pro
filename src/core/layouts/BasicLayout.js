import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Icon, message, BackTop, Popover } from 'antd';
import DocumentTitle from 'react-document-title';
import { connect } from 'dva';
import { Route, Redirect, Switch, routerRedux } from 'dva/router';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import { enquireScreen } from 'enquire-js';
import NProgress from 'nprogress';
import GlobalHeader from '../../components/GlobalHeader';
import GlobalFooter from '../../components/GlobalFooter';
import SiderMenu from '../../components/SiderMenu';
import NotFound from '../../routes/Exception/404';
import { getRoutes } from '../utils/utils';
import Authorized from '../utils/Authorized';
import logo from '../../assets/logo.svg';
import pkaq from '../../assets/pkaq.svg';

const { Content, Header, Footer } = Layout;
import themeBlue from '../../core/style/theme-blue.less';
import themeGreen from '../../core/style/theme-green.less';
import App from "../../components/App/App";
import * as AppInfo from '../../core/common/AppInfo';

let lastHref;
const { AuthorizedRoute } = Authorized;

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
  },
};

let isMobile;
enquireScreen((b) => {
  isMobile = b;
});
@App
@connect(({ theme, loading, global })  => ({
  loading,
  theme,
  currentUser: global.currentUser,
  collapsed: global.collapsed,
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
}))
export default class BasicLayout extends React.Component {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
  };

  state = {
    isMobile,
  };
  getChildContext() {
    const { location, routerData } = this.props;
    return {
      location,
      breadcrumbNameMap: routerData,
    };
  }
  componentDidMount() {
    enquireScreen((mobile) => {
      this.setState({
        isMobile: mobile,
      });
    });
    this.props.dispatch({
      type: 'user/fetchCurrent',
    });
  }
  // 页面title
  getPageTitle(routerData) {
    const { location, } = this.props;
    const { pathname } = location;
    let title = 'Ant Design Pro';
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - Ant Design Pro`;
    }
    return title;
  }
  getBashRedirect = () => {
    const { location, loading } = this.props;
    // 添加nprogress样式
    const href = location.pathname;
    if (lastHref !== href) {
      NProgress.start();
      if (!loading.global) {
        NProgress.done();
        lastHref = location.pathname;
      }
    }
    // According to the url parameter to redirect
    // 这里是重定向的,重定向到 url 的 redirect 参数所示地址
    const urlParams = new URL(window.location.href);

    const redirect = urlParams.searchParams.get('redirect');
    // Remove the parameters in the url
    if (redirect) {
      urlParams.searchParams.delete('redirect');
      window.history.replaceState(null, 'redirect', urlParams.href);
    } else {
      return '/dashboard/analysis';
    }
    return redirect;
  };
  handleMenuCollapse = (collapsed) => {
    this.props.dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };
  handleNoticeClear = (type) => {
    message.success(`清空了${type}`);
    this.props.dispatch({
      type: 'global/clearNotices',
      payload: type,
    });
  };
  handleMenuClick = ({ key }) => {

    if (key === 'triggerError') {
      this.props.dispatch(routerRedux.push('/exception/trigger'));
      return;
    }
    if (key === 'logout') {
      this.props.dispatch({
        type: 'login/logout',
      });
    }
  };
  handleNoticeVisibleChange = (visible) => {
    if (visible) {
      this.props.dispatch({
        type: 'global/fetchNotices',
      });
    }
  };
  // 切换主题
  changeTheme = () => {
    const { theme } = this.props.theme;

    this.props.dispatch({
      type: 'theme/switchTheme',
      payload: {
        theme: theme === themeBlue? themeGreen : (theme === null? themeBlue : null)
      }
    });
  };
  render() {
    const {
      currentUser, collapsed, fetchingNotices, notices, routerData, match, location, menus
    } = this.props;

    /**
     * 根据菜单取得重定向地址.
     */
    const redirectData = [];
    const getRedirect = (item) => {
      if (item && item.children) {
        if (item.children[0] && item.children[0].path) {
          redirectData.push({
            from: `/${item.path}`,
            to: `/${item.children[0].path}`,
          });
          item.children.forEach((children) => {
            getRedirect(children);
          });
        }
      }
    };
    menus.forEach(getRedirect);

    const bashRedirect = this.getBashRedirect();
    const layout = (
      <Layout>
        <SiderMenu
          logo={logo}
          // 不带Authorized参数的情况下如果没有权限,会强制跳到403界面
          // If you do not have the Authorized parameter
          // you will be forced to jump to the 403 interface without permission
          Authorized={Authorized}
          menuData={menus}
          collapsed={collapsed}
          location={location}
          isMobile={this.state.isMobile}
          onCollapse={this.handleMenuCollapse}
        />
        <Layout style={{ height: '100vh', overflow: 'scroll' }} >
          <Header style={{ padding: 0 }}>
            <GlobalHeader
              logo={logo}
              currentUser={currentUser}
              fetchingNotices={fetchingNotices}
              notices={notices}
              collapsed={collapsed}
              isMobile={this.state.isMobile}
              onNoticeClear={this.handleNoticeClear}
              onCollapse={this.handleMenuCollapse}
              onMenuClick={this.handleMenuClick}
              onNoticeVisibleChange={this.handleNoticeVisibleChange}
            />
          </Header>
          <Content style={{ margin: '24px 24px 0', height: '100%' }}>
            <Switch>
              {
                redirectData.map(item =>
                  <Redirect key={item.from} exact from={item.from} to={item.to} />
                )
              }
              {
                getRoutes(match.path, routerData).map(item =>
                  (
                    <AuthorizedRoute
                      key={item.key}
                      path={item.path}
                      component={item.component}
                      exact={item.exact}
                      authority={item.authority}
                      redirectPath="/exception/403"
                    />
                  )
                )
              }
              <Redirect exact from="/" to={bashRedirect} />
              <Route render={NotFound} />
            </Switch>
            {/* pkaq pin icon*/}
            <BackTop visibilityHeight={ -1 }>
              <Popover content="Hi jack" trigger="hover" onClick={() => this.changeTheme()}>
                <img src={pkaq} alt="pkaq" style={{ height:60,width:60 }} />
              </Popover>
            </BackTop>
          </Content>
          <Footer style={{ padding: 0 }}>
            <GlobalFooter
              links={[{
                key: 'Pro 首页',
                title: 'Pro 首页',
                href: 'http://pro.ant.design',
                blankTarget: true,
              }, {
                key: 'github',
                title: <Icon type="github" />,
                href: 'https://github.com/ant-design/ant-design-pro',
                blankTarget: true,
              }, {
                key: 'Ant Design',
                title: 'Ant Design',
                href: 'http://ant.design',
                blankTarget: true,
              }]}
              copyright={
                <div>
                  Copyright <Icon type="copyright" /> { AppInfo.copyRight }
                </div>
              }
            />
          </Footer>
        </Layout>
      </Layout>
    );

    return (
      <DocumentTitle title={this.getPageTitle(routerData)}>
        <ContainerQuery query={query}>
          {params => <div className={classNames(params)}>{layout}</div>}
        </ContainerQuery>
      </DocumentTitle>
    );
  }
}
