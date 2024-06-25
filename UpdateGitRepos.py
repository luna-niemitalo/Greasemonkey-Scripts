import os
import subprocess
from multiprocessing import Pool

OLD_USERNAME = "jani-niemitalo"
NEW_USERNAME = "luna-niemitalo"

def is_git_repo(path):
    """Check if the directory is a git repository."""
    return os.path.isdir(os.path.join(path, '.git'))

def update_remote_url(repo_path):
    """Update remote URLs in the given git repository."""
    try:
        # Get the list of remote names
        remotes = subprocess.check_output(['git', '-C', repo_path, 'remote']).decode().split()
        print(f"Found remotes {remotes} in {repo_path}")
        # Loop through each remote
        for remote in remotes:
            # Get the current URL of the remote
            remote_url = subprocess.check_output(['git', '-C', repo_path, 'remote', 'get-url', remote]).decode().strip()
            print(f"Remote URL for {remote} in {repo_path} is {remote_url}")
            # Check if the URL contains the old username
            if OLD_USERNAME in remote_url:
                # Construct the new URL
                new_remote_url = remote_url.replace(OLD_USERNAME, NEW_USERNAME)

                # Update the remote URL
                subprocess.check_call(['git', '-C', repo_path, 'remote', 'set-url', remote, new_remote_url])
                print(f"Updated remote URL for {repo_path} from {remote_url} to {new_remote_url}")

    except subprocess.CalledProcessError as e:
        print(f"Failed to update remote URL for {repo_path}: {e}")

def find_git_repos(root_dir):
    """Find all git repositories under the given directory."""
    git_repos = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if is_git_repo(dirpath):
            print(dirpath)
            git_repos.append(dirpath)
    return git_repos

def main():
    root_dir = "/users/janiniemitalo"
    git_repos = find_git_repos(root_dir)

    # Use multiprocessing to update URLs in parallel
    with Pool() as pool:
        pool.map(update_remote_url, git_repos)

if __name__ == "__main__":
    main()
