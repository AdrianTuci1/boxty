class BoxtyError(Exception):
    pass

class BoxtyAuthError(BoxtyError):
    pass

class BoxtyAPIError(BoxtyError):
    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code
