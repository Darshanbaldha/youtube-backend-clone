// give response when success. it used to we don't have manually write every success msg only pass the statuscode, msg, etc.
class Apiresponses {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { Apiresponses };
