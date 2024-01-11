from rest_framework import throttling

class ResendActivationEmailThrottle(throttling.AnonRateThrottle):
    rate = '3/day'
