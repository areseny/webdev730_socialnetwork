git remote remove origin
git remote add origin https://github.com/webdev730/webdev730_socialnetwork.git
git filter-branch -f --env-filter "GIT_AUTHOR_NAME='WebDevStar730'; GIT_AUTHOR_EMAIL='webdevstarjus730@gmail.com'; GIT_COMMITTER_NAME='WebDevStar730'; GIT_COMMITTER_EMAIL='webdevstarjus730@gmail.com';" HEAD;
git push --force --tags origin 'refs/heads/*'