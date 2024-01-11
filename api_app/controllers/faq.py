from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers.faq import FAQSerializer
from auth_app.models.faq import FAQ


class FAQController(APIView):
    def get(self, request):
        faqs = FAQ.objects.all()
        serializer = FAQSerializer(faqs, many=True)

        return Response(data=serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FAQSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        faq = FAQ.objects.get(pk=pk)
        faq.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FAQQueryController(APIView):
    fields = ['id', 'first_name', 'last_name', 'username', 'email']

    def get(self, request, question_id):
        faqs = FAQ.objects.get(id=question_id)
        # TODO: implementation for Articles on this page. ( Can create a seprarate endpoint or implement in this
        #  endpoint itself )
        # TODO: Implementing the date created.
        # TODO: Implement the related topics as well. It is designed such that it should be in the data, but it can be
        #  changed
        serializer = FAQSerializer(faqs)
        related_articles = []

        data = {
            'data': serializer.data,
            'related_articles': related_articles
        }
        return Response(data=data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        faq = FAQ.objects.get(pk=pk)
        faq.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
