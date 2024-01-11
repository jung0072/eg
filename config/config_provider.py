import json
import os


class ConfigProvider:
    def __init__(self):
        self.__set_config_file_name()
        self.__load_secrets()

    def get_config(self, category: str, key: str):
        category_configs = self.__get_configs_of_category(category)

        try:
            config = category_configs[key]
        except KeyError:
            raise KeyError(f'No value found for key: "{key}" in configuration file: "{self.config_file_name}"')

        return config

    def __set_config_file_name(self):
        app_env = os.getenv('APP_ENV', 'development')

        if app_env == 'test':
            self.config_file_name = 'secrets-template.json'
        else:
            self.config_file_name = 'secrets.json'

    def __load_secrets(self):
        config_file = open(f'config/secrets/{self.config_file_name}', 'r')
        self.configs = json.load(config_file)

    def __get_configs_of_category(self, category: str):
        try:
            configs = self.configs[category]
        except KeyError:
            raise KeyError(f'No values found for category: "{category}" in configuration file: "{self.config_file_name}"')

        return configs
