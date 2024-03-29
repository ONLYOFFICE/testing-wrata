# wrata

This project is used to run scripts on distributed network with parallel execution

## How it works

Basically workflow consists of several simple steps:

1. Creating DigitalOcean droplets (`Server` class model in project code)
with specified count.
Count of servers depends of tasks.
Some projects has a small number of rspec files,
so 1-5 droplets is enough
Some of them got 10000s of specs and requires 10s of droplets
2. Adding `rspec` files from project to test list with specified parameters
(testing server url, language, browser, etc...)
3. Each of those `rspec` files are run on one of droplets,
chosen from free one in queue
4. After each of `rspec` files are finished - servers can be turn-off manually
or via non-active timeout (Default 1 hour)

## How to start debug session

1. Start docker container with disposable database:

   ```shell
   docker run --rm \
     --name wrata-debug-psql \
     -e POSTGRES_HOST_AUTH_METHOD=trust \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_DB=wrata_development \
     -d \
     -p 5432:5432 \
     postgres
   ```

2. Run DB migrations:

   ```shell
   ENV=develoment rake db:create db:migrate db:seed
   ```

3. Start Rails debug session in RubyMine. Set `RAILS_MASTER_KEY` env correctly.
4. Open `http://localhost:3000` in browser and create new admin
   with username from `config/credentials.yml.enc`
5. Do your debug
6. After debug is done stop DB. It automatically removed after stop:

   ```shell
   docker stop wrata-debug-psql
   ```

## How to update

This should be done after ~1 hour after merging PR to master
Because this [task](https://github.com/ONLYOFFICE/testing-wrata/blob/46786484e8ba852c3af6321e2889b949448776e5/.github/workflows/docker-hub-push.yml#L1)
will create docker hub image with name `onlyoffice/wrata:latest`
and this task is not very fast

```shell script
git pull --prune
docker compose pull app
docker compose up -d
```

## Credential options

This config is stored in `config/credentials.yml.enc` file, encrypted  
To edit stored data you should create file `config/master.key` with secret word
specified secure password storage
(search password file by `config/master.key`)  
And after that call `bin/rails credentials:edit` to edit secret file,
to add or remove values

Example of file layout is:

```yaml
secret_key_base: key # secret key
github_user: user # user of github to fetch projects
github_password: pass # password of user
ssh_user: user # username for node
ssh_pass: pass # password for node
admin_emails:
  - email1@domain1.com
  - email2@domain.com
```

## SSL Setup

By default this repo require SSL certificates to work.  
`./certs/tls.crt` and `./certs/tls.key` should
exists on your host, outside docker  
You can disable it by changing `nginx.conf`

## How to update `nginx` container

```shell
docker-compose stop
docker-compose rm web
docker-compose pull web
docker-compose up -d
```

## How to backup database

```shell
docker-compose exec db pg_dumpall -c -U postgres | gzip > dump_$(date +"%Y-%m-%d_%H_%M_%S").gz
```

## How to restore database backup

```shell
docker-compose stop app
zcat dump*.gz | docker exec -i testing-wrata_db_1 psql -U postgres
docker-compose start app
```

## Admin account

Admin account is account that have same name as email in `admin_emails` list in secrets
Admin account is different in two ways:

1. Admin can add new users to wrata via `https://wrata-url/clients` page
2. Admin email receive notifications about with some failure information which includes:
   * `spec_no_tests_executed_email` - this mean some rspec do not output any result.
      Usually this mean something is not properly configure.
      For example spec contains not a single `it`
   * `spec_failed_email` - this mean spec failed mid-execution.
     Usually this is a networking error and simple restart of `spec` can help
   * All other failures - this is some bad code.
     Sometimes then creating Droplet in DigitalOcean - DO servers return 500
     instead of creating ones. Usually fixed by restarting create process

## Troubleshooting

* For `uninitialized constant HtmlWithPassedTime (NameError)`
  error in logs you should add `rspec_passed_time_formatter`
  gem dependency in project file.  
  Since [#857](https://github.com/ONLYOFFICE/testing-wrata/pull/857)
* High SQL storage usage - this is normal, because we store all logs in database
  and they are not deleted automatically.  
  You can delete them manually by logging as active user, going to
  `Profile` -> `Run history` -> `Clear history`.  
  After that you should wait some time for postgres
  to delete all data or trigger `VACUUM` manually
* node is hangup on creation  
  Usually this happens when DigitalOcean return 500 error on server creation.  
  It's out of our control, you only can recover in this situation  
  First via DigitalOcean control panel check status
  of this server (is it created or not)  
  Usually it will be already created (if not - just change wrata status to `destroyed`)
  Next open [https://wrata-url/servers](https://wrata-url/servers),
  find the node in question and change it's status to 'created'  
  After that usually self-destruction mechanism triggered due to known problem,
  and server will be destroyed automatically  
  After that recreate server as usual, via Create button or REST API

## How to release new version (for maintainers)

1. Update `VERSION` file
2. Update `CHANGELOG.md` by adding version line after `master (unreleased)`
3. Create PR with those changes and merge to `master`
4. On `master` run `rake add_repo_tag`
5. On `GitHub` create new release via web-browser and add info from `CHANGELOG.md`
