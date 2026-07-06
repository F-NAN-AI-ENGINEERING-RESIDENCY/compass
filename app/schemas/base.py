from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for API-facing schemas: fields defined in snake_case, serialized as camelCase."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)
