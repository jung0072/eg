from config.config_provider import ConfigProvider


class WebLinksMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self.process_request(request)
        return self.get_response(request)

    def process_request(self, request):
        config_provider = ConfigProvider()
        """Add on any constant values needed for engage like the url for engage and insightScope web servers."""
        request.engage_ic4u_url = config_provider.get_config('environment', 'server_name')
        request.insight_scope_url = config_provider.get_config('sso', 'server')
        return request
