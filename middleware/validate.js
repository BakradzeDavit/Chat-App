// ✅ Reusable validation middleware
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate the request against the schema
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      // If validation passes, continue to next middleware
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        
        return res.status(400).json({
          message: "Validation failed",
          errors: formattedErrors,
        });
      }
      
      // Handle other errors
      return res.status(400).json({
        message: "Validation error",
        error: error.message,
      });
    }
  };
};

module.exports = { validate };
