# Engage

## Development Environment Setup

### Requirements:

1. Python 3.10.4 for macOS or Python 3.10.3 for windows
2. PostgreSQL 10.X (take a note of port and login credentials while installing)
3. Pycharm Professional. Professional licence of all JetBrains products is available for students.
   Checkout [this](https://www.jetbrains.com/shop/eform/students)
4. Database management system like pgAdmin or DBeaver
5. Latest release
   of [insightScope](https://github.com/Insight-Scope/insight-scope-documentation/blob/master/development-environment.md)
   running for user authentication

### Environment Setup:

1. Clone the repository to your preferred location. Switch to the current release branch (ask a team member)
2. Open PyCharm
3. _File > Open_ - Point it to the _engage_ repo directory cloned in Step 1
4. Once the project opens, Click _File > Settings > Project Interpreter_
5. Click on the settings button on the top right and then click _Add_
6. Make sure _Virtual Environment_ is selected on the left bar and _New Environment_ is selected
7. Specify the location anywhere outside the directory that we cloned in Step 1
8. Select the base interpreter and point it to the _python.exe_ - It would be in the folder where you installed python (
   Make sure you are pointing it to 3.10.X version, if you have multiple versions of python installed)
9. Click OK and wait for the environment to get created
10. Once that is done, open the requirements.txt file in PyCharm which is at the root of the project. When you open the
    file you should see a warning pop up saying that you should install some requirements. Click the 'Install
    Requirements' button. Wait for the installations to get completed. you can see the progress in the bottom toolbar.
    You can also complete this step manually. Open _Terminal_ in PyCharm and run `pip install -r requirements.txt`
11. For the S3Service Provider, this is a custom package that we at SLiDE have built to share code between
    insight-scope, engage and any future applications. To install this package you will need to create a personal access
    token with GitHub and use your username and new access token to download.
12. Once that is done, open your Database management system (DBeaver) and create a database named _engagedevdb_
13. Navigate to `engage/config/secrets`
14. Copy `secrets-template.json` file to a new file as `secrets.json` in the same directory. You will need to request
    the admin to provide you with the required credentials
15. To create .env file for react_app, Navigate to `engage/config/secrets`
16. To run the background task, run `python manage.py process_tasks`. 
17. Copy `.env-react-template` file to a new file as `.env-react` in the same directory. Make sure that the
    REACT_APP_BASE_API_URL url is same as the host url.
18. Once these are configured, Open Terminal in PyCharm and run `python manage.py migrate`. This runs migrations
    required to create Tables in your database
19. After running the migrations, run `python manage.py render_app`. This will generate all the necessary JSON files for
    the React app, which will be located under `react_app/src/components/utils/json_forms/*`. These files are used by
    the Render Chan to display forms.
20. Click _Run > Edit Configurations_. Make sure the host is set to 127.0.0.2 as 127.0.0.1 will be used by insightScope
    1. If You are on MacOS. Make sure your host for engage is 127.0.0.1:8000 and the host for insight-scope is
       127.0.0.1:8001 since you will not have 127.0.0.2 available to host on.
21. Click `Run` or `Debug` button in PyCharm and your project should be running. An alternative way to run the project
    is Open Terminal in PyCharm and run `python manage.py runserver 127.0.0.2:8000`
22. Run smtp4dev using the command `docker run --rm -it -p 3001:80 -p 2525:25 rnwood/smtp4dev`
23. You should be able to access your application at `127.0.0.2:8000` (or whatever host it was set to for Engage)

### Setup Database Script:

- optionally instead of running migrations, downloading cities_light and building the React application you can run the
  following command to perform all these operations in succession.

```shell
python manage.py setup_db
```

### Creating Admin User:

- A user that is an admin for 1 platform is not automatically the admin for another
- To create an admin use the console command 'python manage.py shell' to access the python shell
- inside the python shell execute the following code to update an existing user to a superuser
- \*\*Admin users are now created automatically. Make sure you have cities-light downloaded and up to date and once you
  run the application a check will be made to see if the admin exists and if not it will create it.
- We may use SSO design patterns in the future so if we do switch back admins can be created as defined above.

```python
from django.contrib.auth.models import User

# this is the id for the admin on insightScope DB, switch the ID to whatever the id of the user
# you want to upgrade is
admin = User.objects.get(id=ADMIN_ID)
admin.is_staff = True
admin.is_superuser = True
admin.save()
```

### Populating the Cities Light Database

- After creating the tables by performing a django migration run the following command

```shell
python manage.py cities_light --progress [--force-import-all]
```

### Setting up the insightScope API Key

- For certain methods on the site like updating User Information, we will need to access both insightScope and Engage
  databases in order to update these items
- We use an API Key to authenticate all of our requests from Engage to the insightScope Server
- To create the API Key, open up the Django Shell on the insightScope Server and run the following code:

```Python
from pi_app.models.utlis.generate_api_key import generate_api_key

# Using the generate_api_key function, create and name an API key for Engage
key = generate_api_key("ENGAGE-API-KEY")
```

- Which will return a tuple with the following:
- (<APIKey: ENGAGE-API-KEY>, 'iPknl0we.b5I2tsO2OOs0dRnlwa7EB9LeDJ2R0YIU')
- Then on the Engage Server environment settings (config/secrets/secrets.json) update the property platform_api_keys.insightScope_api_key
- Update the inisghtScope_url as well -> platform_url.insightScope_url
- To use the value from the second part of the tuple ('iPknl0we.b5I2tsO2OOs0dRnlwa7EB9LeDJ2R0YIU') as seen below:

```JSON
{
  "platform_url": {
    "educate_url": "http://127.0.0.1:3000",
    "insightScope_url": "http://127.0.0.1:8000"
  },
  "platform_api_keys": {
    "insightScope_api_key": "AMG2PpeM.YBPMiFuNIhFLYJQeYA2mK7whoPAZUIop"
  }
}
```

### Running Redis with Django Channels

- To run redis first set the connection properties inside /config/secrets.secrets.json redis
- Using docker run the command

```bash
# To start the redis docker container
cd config/redis/
docker-compose up -d

# To start the redis server (when installed to the machine directly)
sudo redis-server ./config/redis/redis.conf
```

### React Application Setup & Usage

- This application was started using Node v19.2.0 and NPM v8.19.3
- To build and run the application you can use the following commands (run all commands in the root directory):

## Running Background Tasks

We use [django-background-tasks](https://django-background-tasks.readthedocs.io/en/latest/) to run some asynchronomus tasks on server. This is ran as a seperate process and needs to be started different from the application startup.

To run django-background-tasks, Click Terminal in PyCharm and run `python manage.py process_tasks`

One thing that you need to be careful when using django-background-tasks is that you will need to restart the process everytime you make change to the code. This is the way that it picks up new code.

In Database, `background_task` and `backgroun_task_completedtask` are the two tables associated with working of django-backuground-tasks. [Read the documentation for more insights](https://django-background-tasks.readthedocs.io/en/latest/)

```shell
# To install the npm packages
npm i --prefix react_app

# To run the development mode npm
npm run --prefix react_app dev

# To preform the production build
run --prefix react_app build
```

### API Testing Dummy Data

1. Add participants to the classroom - Educate
   - **URL:** `/educate/api/classrooms/{classroom_id}/participation/user_management/`
   - **Dummy User Data Format (JSON):**
   
   ```json
   dummy_user_list_data = [
       {
           'first_name': 'a',
           'last_name': 'a',
           'email': 'a@a.com'
       },
       {
           'first_name': 'b',
           'last_name': 'b',
           'email': 'b@b.com'
       },
       {
           'first_name': 'c',
           'last_name': 'c',
           'email': 'c@c.com'
       }
   ]
