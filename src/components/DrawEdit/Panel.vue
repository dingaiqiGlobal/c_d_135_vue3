<template>
  <div class="container">
    <!-- 头部选项卡 -->
    <div class="header-tabs">
      <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
        <el-tab-pane label="点" name="point"></el-tab-pane>
        <el-tab-pane label="线" name="line"></el-tab-pane>
        <el-tab-pane label="多边形" name="polygon"></el-tab-pane>
        <el-tab-pane label="圆形" name="circle"></el-tab-pane>
        <el-tab-pane label="椭圆" name="ellipse"></el-tab-pane>
        <el-tab-pane label="扇形" name="sector"></el-tab-pane>
      </el-tabs>
    </div>
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-input
        class="search-box"
        v-model="searchName"
        placeholder="名称模糊查询"
        clearable
        @clear="handleSearch"
        @keyup.enter.native="handleSearch"
      >
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>

      <!-- 改为select选择器 -->
      <el-select
        v-model="areaType"
        placeholder="请选择区域类型"
        @change="handleAreaTypeChange"
        class="area-select"
      >
        <el-option label="适飞区" value="flyable"></el-option>
        <el-option label="管制区" value="controlled"></el-option>
        <el-option label="禁飞区" value="restricted"></el-option>
      </el-select>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" size="small" @click="handleAdd">新增</el-button>
      <el-button
        type="danger"
        size="small"
        :disabled="selectedItems.length === 0"
        @click="handleBatchDelete"
        >批量删除</el-button
      >
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"> </el-table-column>
      <el-table-column prop="name" label="名称" width="180"> </el-table-column>
      <el-table-column prop="type" label="用途类型" width="180">
        <template slot-scope="scope">
          <el-tag :type="getTagType(scope.row.type)">{{ getTypeText(scope.row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template slot-scope="scope">
          <el-button size="mini" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)"
            >删除</el-button
          >
          <el-button size="mini" @click="handleCopy(scope.$index, scope.row)">拷贝</el-button>
          <el-button size="mini" type="success" @click="handleShow(scope.$index, scope.row)"
            >显示</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'Panel',
  components: {},
  props: {},
  data() {
    return {
      // 头部选项卡
      activeTab: 'point',
      // 搜索区域
      searchName: '',
      areaType: '', // 改为空值，显示默认placeholder
      // 表格数据
      tableData: [
        { id: 1, name: '测试-点', type: '1' },
        { id: 2, name: '测试-线', type: '2' },
        { id: 3, name: '测试-多边形', type: '3' },
      ],
      // 选中的行
      selectedItems: [],
    }
  },
  mounted() {},
  methods: {
    // 头部选项卡点击事件
    handleTabClick(tab) {
      console.log('当前选中选项卡:', tab.name)
      // 这里可以根据选项卡切换数据
    },

    // 区域类型切换
    handleAreaTypeChange(value) {
      console.log('当前区域类型:', value)
      // 这里可以根据区域类型筛选数据
    },

    // 搜索处理
    handleSearch() {
      console.log('搜索名称:', this.searchName)
      // 这里可以实现搜索逻辑
    },

    // 表格选择变化
    handleSelectionChange(val) {
      this.selectedItems = val
      console.log('选中项:', val)
    },

    // 获取标签类型
    getTagType(type) {
      const typeMap = {
        1: 'success',
        2: 'warning',
        3: 'danger',
      }
      return typeMap[type] || 'info'
    },

    // 获取类型文本
    getTypeText(type) {
      const textMap = {
        1: '适飞区',
        2: '管制区',
        3: '禁飞区',
      }
      return textMap[type] || '未知'
    },

    // 新增
    handleAdd() {
      this.$message({
        message: '新增功能',
        type: 'info',
      })
    },

    // 批量删除
    handleBatchDelete() {
      this.$confirm('确定要删除选中的项吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          this.$message({
            type: 'success',
            message: '删除成功!',
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除',
          })
        })
    },

    // 编辑
    handleEdit(index, row) {
      this.$message({
        message: `编辑第${index + 1}行: ${row.name}`,
        type: 'info',
      })
    },

    // 删除
    handleDelete(index, row) {
      this.$confirm('确定要删除该项吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          this.tableData.splice(index, 1)
          this.$message({
            type: 'success',
            message: '删除成功!',
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除',
          })
        })
    },
    // 拷贝
    handleCopy(index, row) {
      this.$message({
        message: `拷贝第${index + 1}行: ${row.name}`,
        type: 'info',
      })
    },

    // 显示
    handleShow(index, row) {
      this.$message({
        message: `显示第${index + 1}行: ${row.name}`,
        type: 'success',
      })
    },
  },
}
</script>

<style lang="less" scoped>
.container {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 750px;
  height: 1129px;
  background: #222222;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  color: #ffffff;

  // 头部选项卡样式 - 修改：左右填充满
  .header-tabs {
    margin-bottom: 20px;
    width: 100%;

    /deep/ .el-tabs--card {
      .el-tabs__header {
        border: none;
        margin: 0;
        width: 100%;
      }

      .el-tabs__nav {
        border: none;
        border-radius: 4px;
        overflow: hidden;
        width: 100%;
        display: flex;
      }

      .el-tabs__item {
        background: #333333;
        border: none;
        color: #cccccc;
        flex: 1; /* 关键修改：使每个选项卡平均分配宽度 */
        text-align: center;
        transition: all 0.3s ease;

        &:hover {
          background: #444444;
          color: #ffffff;
        }

        &.is-active {
          background: #409eff;
          color: #ffffff;
        }
      }
    }
  }

  // 搜索区域样式
  .search-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;
    color: #888888;

    .search-box {
      flex: 1;

      /deep/ .el-input__inner {
        background: #333333;
        border: 1px solid #555555;
        color: #ffffff;
        border-radius: 4px;

        &::placeholder {
          color: #888888;
        }

        &:focus {
          border-color: #409eff;
        }
      }

      /deep/ .el-input__icon {
        color: #888888;
      }
    }

    // 区域选择器样式 - 修改：默认显示placeholder
    .area-select {
      width: 150px;

      /deep/ .el-input__inner {
        background: #333333;
        border: 1px solid #555555;
        color: #888888; /* 修改：使placeholder文字颜色更明显 */
        border-radius: 4px;

        &:focus {
          border-color: #67c23a;
        }
      }

      /deep/ .el-input__suffix {
        .el-select__caret {
          color: #888888;
        }
      }
    }

    // 下拉菜单样式
    /deep/ .el-select-dropdown {
      background: #333333;
      border: 1px solid #555555;
      border-radius: 4px;

      .el-select-dropdown__item {
        color: #cccccc;
        background: #333333;

        &:hover {
          background: #444444;
          color: #ffffff;
        }

        &.selected {
          background: #67c23a;
          color: #ffffff;
        }
      }

      .el-select-dropdown__empty {
        color: #888888;
      }
    }
  }

  // 操作按钮样式 - 修改：靠左对齐
  .action-buttons {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-start; /* 关键修改：按钮靠左对齐 */
    gap: 10px;

    /deep/ .el-button {
      border-radius: 4px;
      font-weight: 500;
      transition: all 0.3s ease;

      &.el-button--primary {
        background: #409eff;
        border-color: #409eff;

        &:hover {
          background: #66b1ff;
          border-color: #66b1ff;
        }
      }

      &.el-button--danger {
        background: #f56c6c;
        border-color: #f56c6c;

        &:hover:not(.is-disabled) {
          background: #f78989;
          border-color: #f78989;
        }

        &.is-disabled {
          background: #733a3a;
          border-color: #733a3a;
          color: #999999;
        }
      }
    }
  }

  // 表格样式 - 修改：防止出现水平滚动条
  /deep/ .el-table {
    background: transparent;
    border: 1px solid #444444;
    border-radius: 4px;
    overflow: hidden;
    width: 100% !important; /* 关键修改：确保表格宽度为100% */

    .el-table__header-wrapper,
    .el-table__body-wrapper {
      background: transparent;
      width: 100% !important;
    }

    th {
      background: #333333 !important;
      border-bottom: 1px solid #444444;
      color: #ffffff;
      font-weight: 600;
    }

    td {
      background: transparent;
      border-bottom: 1px solid #444444;
      color: #cccccc;
    }

    tr {
      background: transparent;

      &:hover td {
        background: #2a2a2a !important;
      }
    }

    .el-table__body tr.current-row td {
      background: #2a2a2a !important;
    }

    // 复选框样式
    .el-checkbox {
      .el-checkbox__inner {
        background: #333333;
        border: 1px solid #555555;

        &:hover {
          border-color: #409eff;
        }
      }

      .el-checkbox__input.is-checked .el-checkbox__inner {
        background: #409eff;
        border-color: #409eff;
      }
    }

    // 标签样式
    .el-tag {
      border: none;
      border-radius: 12px;
      font-weight: 500;

      &.el-tag--success {
        background: #67c23a;
        color: #ffffff;
      }

      &.el-tag--warning {
        background: #e6a23c;
        color: #ffffff;
      }

      &.el-tag--danger {
        background: #f56c6c;
        color: #ffffff;
      }

      &.el-tag--info {
        background: #909399;
        color: #ffffff;
      }
    }

    // 表格内按钮样式
    .el-button {
      border-radius: 4px;
      font-weight: 500;
      transition: all 0.3s ease;

      &.el-button--mini {
        padding: 5px 10px;
        font-size: 12px;
      }

      &:not(.el-button--text):not(.el-button--success):not(.el-button--danger) {
        background: #555555;
        border-color: #555555;
        color: #ffffff;

        &:hover {
          background: #666666;
          border-color: #666666;
        }
      }

      &.el-button--success {
        background: #67c23a;
        border-color: #67c23a;

        &:hover {
          background: #85ce61;
          border-color: #85ce61;
        }
      }

      &.el-button--danger {
        background: #f56c6c;
        border-color: #f56c6c;

        &:hover {
          background: #f78989;
          border-color: #f78989;
        }
      }
    }
  }

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #333333;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #555555;
    border-radius: 3px;

    &:hover {
      background: #666666;
    }
  }
}
</style>
