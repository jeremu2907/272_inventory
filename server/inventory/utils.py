# Helper function to get all field names of a model
def get_all_model_fields(model):
    return [field.name for field in model._meta.fields]