module.exports = {
	/*
	 * 添加地址
	 */
	insert_address: 'INSERT INTO address_info (name, is_male, phone, area, specific_address, user_id) VALUES (?, ?, ?, ?, ?, ?)',
	/*
	 * 查询地址
	 */
	query_address: 'SELECT * FROM address_info WHERE user_id = ?',
	/*
	 * 查询订单类型信息
	 */
	query_order_type_info: 'SELECT * FROM order_type_infor WHERE parent_type = ?',
	/*
	 * 查询用户信息
	 */
	query_user_info: 'SELECT * FROM user WHERE id = ?',
	/*
	 * 查询用户是否注册
	 */
	query_user_is_register: 'SELECT id FROM user WHERE open_id = ?',
	/*
	 * 查询订单列表
	 */
	query_order_list: 'SELECT order_time, gmt_create, money_number, type_description  FROM order_list, order_type_infor WHERE user_id = ? AND order_list.order_type_id = order_type_infor.id',
}

