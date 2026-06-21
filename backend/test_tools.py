import os
import unittest

from tools import get_user_workspace_root


class ToolsWorkspaceTests(unittest.TestCase):
    def test_user_workspace_root_is_user_specific(self):
        root = get_user_workspace_root("demo-user")

        self.assertTrue(os.path.isdir(root))
        self.assertTrue(
            root.startswith(os.path.abspath(os.path.join(os.path.dirname(__file__), "workspaces")))
        )
        self.assertNotEqual(
            root,
            os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        )


if __name__ == "__main__":
    unittest.main()
