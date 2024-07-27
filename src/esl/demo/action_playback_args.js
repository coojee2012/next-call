const data = {
  logic: {
    input: true,
    doneGo: '',
    errorGo: '',
  },
  pbx: {
    transfer_on_failure: '',
    digit_timeout: 30,
    regexp: '',
    var_name: '',
    invalid_file: '',
    input_err_file: '',
    input_timeout_file: '',
    input_err_retry: 3,
    input_timeout_retry: 3,
    file_from_var: '',
    file: 'demo/welcome.wav',
    terminators: '#', // 输入结束标识
    timeout: 30,
    tries: 5,
    max: 1, // 当接受按键数等于最大值时自动终止接受
    min: 1,
  },
};
console.log("1111111")
console.log(JSON.stringify(data))
