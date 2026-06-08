Uses .github/workflows/release.yml
1) add release id to manifest.json and/or manifest-beta.json
   0.1.0, or 0.1.0-beta-x
2) add, commit, push
  git add .
  git commit -m "..."
  git push origin master
3) Tag and trigger release
  git tag 0.1.0-beta-x
  git push origin 0.1.0-beta-x

---

When I need to rerun the release:
# 1. Delete the tag from your local repository
git tag -d 0.1.0

# 2. Delete the tag from GitHub
git push origin --delete 0.1.0