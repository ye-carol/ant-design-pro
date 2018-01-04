import React, {PureComponent} from 'react';
import {Table, Input, Divider } from 'antd';
// 字典管理左侧列表树
const Search = Input.Search;
export default class DictGrid extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'dict/loadDict'
    });
  }
  // 行点击事件
  handleOnRowClick = (record, index) => {
    // 根节点不加载
    if(record.parent === 0) {
      return;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'dict/getDict',
      payload: {id: record.id,}
    });
  };

  // 搜索事件
  handleOnSearch = (val) => {
    const { dispatch } = this.props;

    console.info("search " + val);
    dispatch({
      type: 'dict/loadDict',
      payload: {filter: val,}
    });
  };

  render() {
    const { loading, data } = this.props;

    const column = [{
      dataIndex: 'name'
    }, {
      dataIndex: 'desc'
    }];

    return (
      <div>
        <Search
          placeholder="字典检索"
          onSearch={value => this.handleOnSearch(value)}
        />
        <Divider dashed={true}/>
        <Table onRow={(record, index) => ( {
                  onClick: () => this.handleOnRowClick(record, index)
                })}
               loading = {loading}
               rowKey={record => record.id}
               defaultExpandAllRows={true}
               scroll={{y: 640}}
               size="small"
               dataSource={data}
               columns={column}
               pagination={false}/>
      </div>
    )
  }
}
